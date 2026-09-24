import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {
	checkout,
	dodopayments,
	portal,
	webhooks,
} from "@dodopayments/better-auth";
import { waitUntil } from "@vercel/functions";
import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { admin } from "better-auth/plugins/admin";
import { haveIBeenPwned } from "better-auth/plugins/haveibeenpwned";
import { username } from "better-auth/plugins/username";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import DodoPayments from "dodopayments";
import { eq } from "drizzle-orm";
import * as authSchema from "@/db/auth-schema";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";
import { auditAuthEndpoint } from "@/lib/auth-audit.server";
import { escapeHtml, sendEmail } from "@/lib/email";
import { securityLog } from "@/lib/security-log";
import { absoluteUrl } from "@/lib/site";
import { allowedImageOrigins, validateUserInput } from "@/lib/user-input";

// El SDK exige un bearerToken no vacío al construirse — sin fallback, no
// tener DODO_PAYMENTS_API_KEY seteada tira abajo *todo* auth.ts (login
// incluido), no solo billing. Con el placeholder, las llamadas a Dodo
// simplemente fallan con un error de auth hasta que se configure la key real.
const dodoClient = new DodoPayments({
	bearerToken: process.env.DODO_PAYMENTS_API_KEY || "missing_dodo_api_key",
	environment:
		process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode"
			? "live_mode"
			: "test_mode",
});

// Distinto product ID entre sandbox y producción en el dashboard de Dodo,
// por eso va por env var y no hardcodeado.
const DODO_PRO_PRODUCT_ID = process.env.DODO_PRO_PRODUCT_ID || "pdt_REPLACE_ME";

async function setPlan(userId: string, plan: "free" | "pro") {
	await db
		.insert(profiles)
		.values({ id: userId, plan })
		.onConflictDoUpdate({
			target: profiles.id,
			set: { plan, updatedAt: new Date() },
		});
}

// El plugin de Dodo también ofrece `createCustomerOnSignUp`, pero su hook
// *lanza* si la llamada a Dodo falla — eso aborta el signup entero (probado:
// sin DODO_PAYMENTS_API_KEY, /api/auth/sign-up/email devuelve 500 con
// cualquier método, no solo email). checkout() y portal() ya resuelven o
// crean el customer por su cuenta si no existe (ver getOrCreateCustomerId en
// @dodopayments/better-auth), así que crearlo acá es solo un best-effort para
// que el metadata quede listo antes del primer pago — nunca debe poder
// romper el registro de un usuario.
async function bestEffortCreateDodoCustomer(user: {
	id: string;
	email: string;
	name: string;
}) {
	try {
		const customer = await dodoClient.customers.create(
			{
				email: user.email,
				name: user.name,
				metadata: { better_auth_user_id: user.id },
			},
			{ idempotencyKey: user.id },
		);
		await db
			.update(authSchema.user)
			.set({ dodoCustomerId: customer.customer_id })
			.where(eq(authSchema.user.id, user.id));
	} catch (e) {
		console.warn(
			`[dodo] best-effort customer creation failed for ${user.id}`,
			e instanceof Error ? e.message : e,
		);
	}
}

// Catálogo completo de eventos de suscripción de Dodo — cualquier tipo no
// listado acá (pagos one-off, etc.) se ignora sin tocar el plan.
const PRO_GRANT_EVENTS = new Set([
	"subscription.active",
	"subscription.renewed",
	"subscription.plan_changed",
	"subscription.unpaused",
]);
const PRO_REVOKE_EVENTS = new Set([
	"subscription.cancelled",
	"subscription.expired",
	"subscription.failed",
	"subscription.on_hold",
	"subscription.paused",
]);

const trustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? "")
	.split(",")
	.map((o) => o.trim())
	.filter(Boolean);

const socialProviders: NonNullable<
	Parameters<typeof betterAuth>[0]["socialProviders"]
> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
	socialProviders.github = {
		clientId: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
	};
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
	socialProviders.google = {
		clientId: process.env.GOOGLE_CLIENT_ID,
		clientSecret: process.env.GOOGLE_CLIENT_SECRET,
	};
}

export const auth = betterAuth({
	appName: "dev-links",
	secret: process.env.BETTER_AUTH_SECRET,
	baseURL: process.env.BETTER_AUTH_URL,

	database: drizzleAdapter(db, {
		provider: "pg",
		schema: authSchema,
	}),

	emailAndPassword: {
		enabled: true,
		autoSignIn: true,
		minPasswordLength: 8,
		maxPasswordLength: 256,
		requireEmailVerification: false,
		sendResetPassword: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: "Reset your dev-links password",
				html: `<p>Hi ${escapeHtml(user.name ?? "")},</p><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
				text: `Reset your password: ${url}`,
			});
		},
		resetPasswordTokenExpiresIn: 60 * 30,
		revokeSessionsOnPasswordReset: true,
	},

	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }) => {
			await sendEmail({
				to: user.email,
				subject: "Verify your dev-links email",
				html: `<p>Welcome to dev-links, ${escapeHtml(user.name ?? "")}.</p><p>Confirm your email: <a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
				text: `Verify your email: ${url}`,
			});
		},
	},

	socialProviders,

	account: {
		// GitHub/Google tokens are stored for server-side use (see
		// autoConnectGithub); encrypt them at rest with BETTER_AUTH_SECRET.
		// Rows written before this was enabled are still read fine —
		// decryptOAuthToken passes through values that aren't encrypted.
		encryptOAuthTokens: true,
		accountLinking: {
			enabled: true,
			trustedProviders: ["github", "google"],
		},
	},

	plugins: [
		// Rejects passwords found in known breaches on sign-up, change and
		// reset. k-anonymity: only the first 5 chars of the SHA-1 hash leave
		// the server. Fails closed (500) if the HIBP API is unreachable.
		haveIBeenPwned({
			customPasswordCompromisedMessage:
				"This password has appeared in a data breach. Please choose a different one.",
		}),
		username({
			minUsernameLength: 3,
			maxUsernameLength: 30,
			usernameValidator: (username) => {
				return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(username);
			},
		}),
		admin({
			defaultRole: "user",
			adminRoles: ["admin"],
		}),
		dodopayments({
			client: dodoClient,
			// false porque el hook propio del plugin lanza si Dodo falla, lo que
			// aborta el signup entero — ver bestEffortCreateDodoCustomer arriba.
			createCustomerOnSignUp: false,
			getCustomerParams: (user) => ({
				metadata: { better_auth_user_id: user.id },
			}),
			use: [
				checkout({
					products: [{ productId: DODO_PRO_PRODUCT_ID, slug: "pro" }],
					successUrl: absoluteUrl("/dashboard?upgraded=1"),
					authenticatedUsersOnly: true,
				}),
				portal(),
				webhooks({
					webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY ?? "",
					onPayload: async (payload) => {
						const isGrant = PRO_GRANT_EVENTS.has(payload.type);
						const isRevoke = PRO_REVOKE_EVENTS.has(payload.type);
						if (!isGrant && !isRevoke) return;

						const data = payload.data as {
							customer?: { metadata?: Record<string, unknown> };
						};
						const userId = data.customer?.metadata?.better_auth_user_id;
						if (typeof userId !== "string") {
							console.warn(
								"[dodo] webhook missing better_auth_user_id metadata",
								payload.type,
							);
							return;
						}

						await setPlan(userId, isGrant ? "pro" : "free");
					},
				}),
			],
		}),
		tanstackStartCookies(),
	],

	user: {
		additionalFields: {
			displayName: {
				type: "string",
				required: false,
				input: true,
			},
		},
	},

	session: {
		// Absolute lifetime: disableSessionRefresh stops using the session
		// from pushing expiresAt forward (updateAge no longer applies), so a
		// session ends 7 days after sign-in no matter how active it is.
		expiresIn: 60 * 60 * 24 * 7,
		disableSessionRefresh: true,
		freshAge: 60 * 60,
		cookieCache: {
			enabled: true,
			maxAge: 60 * 5,
			strategy: "jwe",
		},
	},

	rateLimit: {
		enabled: true,
		storage: "database",
		window: 60,
		max: 100,
		// Keys are matched against the path *without* the /api/auth base path
		// (see resolveRateLimitConfig in better-auth) — the previous
		// "/api/auth/..." keys never matched, so none of these applied.
		customRules: {
			"/sign-in/email": { window: 60, max: 5 },
			"/sign-in/username": { window: 60, max: 5 },
			"/sign-up/email": { window: 60, max: 3 },
			"/request-password-reset": { window: 60, max: 3 },
			"/reset-password": { window: 60, max: 3 },
			"/change-password": { window: 60, max: 5 },
			"/send-verification-email": { window: 60, max: 3 },
			"/verify-email": { window: 60, max: 5 },
			"/sign-in/social": { window: 60, max: 10 },
			"/sign-out": false,
		},
	},

	trustedOrigins,

	// better-auth's own warnings/errors as single JSON lines, same shape as
	// the security audit log (lib/security-log.ts) so both can be searched
	// together in Vercel. JSON.stringify also escapes CR/LF (no log forging).
	logger: {
		level: "warn",
		log: (level, message, ...args) => {
			const line = JSON.stringify({
				ts: new Date().toISOString(),
				type: "better-auth",
				level,
				message,
				args,
			});
			if (level === "error") console.error(line);
			else console.warn(line);
		},
	},

	// sign-up and /update-user write name/image straight from the client,
	// bypassing profile-data's validators (the profile form caps the name at
	// 60 chars, but updateUser accepted anything, and any string as image).
	hooks: {
		before: createAuthMiddleware(async (ctx) => {
			if (ctx.path !== "/sign-up/email" && ctx.path !== "/update-user") return;
			const error = validateUserInput(
				ctx.body as Record<string, unknown> | undefined,
				allowedImageOrigins(process.env.R2_PUBLIC_URL),
			);
			if (error) throw new APIError("BAD_REQUEST", { message: error });
		}),
		// Audit trail for credential, recovery, session and admin endpoints —
		// runs for failures too (ctx.context.returned is the APIError).
		after: createAuthMiddleware(async (ctx) => {
			auditAuthEndpoint(ctx);
		}),
	},

	// Nothing in the browser needs the provider tokens, but these endpoints
	// hand them to any script running with the user's session cookie (an
	// XSS would get a live GitHub/Google token). Server code still reaches
	// them through auth.api, which doesn't go through the HTTP router.
	disabledPaths: ["/get-access-token", "/refresh-token"],

	advanced: {
		// Without a handler, better-auth awaits the reset/verification emails
		// before responding, so forget-password answers measurably slower for
		// an existing email than for an unknown one (account enumeration).
		// waitUntil sends them after the response while keeping the Vercel
		// function alive until they finish; outside Vercel it's a no-op and
		// the promise simply runs to completion.
		backgroundTasks: { handler: waitUntil },
		useSecureCookies: process.env.NODE_ENV === "production",
		cookiePrefix: "devlinks",
		defaultCookieAttributes: {
			sameSite: "lax",
		},
		ipAddress: {
			ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
			ipv6Subnet: 64,
		},
	},

	// NOTA: with-hooks.mjs (better-auth 1.7.4) llama a cada hook create/update
	// como toRun(record, context) — el primer argumento es la fila cruda
	// (user/session), no un wrapper { data, oldData }. La versión anterior de
	// estos hooks asumía ese wrapper: session.create/delete usaban `?.` así
	// que solo logueaban undefined en silencio, pero user.update accedía
	// data.email sin `?.` y tiraba abajo CUALQUIER update-user con un
	// TypeError no capturado (confirmado: rompía tanto el cambio de avatar
	// como el refresco de sesión después de onboarding). No hay `oldData`
	// disponible en esta versión, así que no se puede detectar el email
	// anterior desde acá.
	databaseHooks: {
		user: {
			create: {
				after: (user) => bestEffortCreateDodoCustomer(user),
			},
			update: {
				after: async (user) => {
					const u = user as { id?: string } | undefined;
					securityLog("auth.user_updated", "success", { userId: u?.id });
				},
			},
		},
		// Account linking is on for GitHub/Google, so a new provider can get
		// attached to an existing user; log every account row created (signup
		// or link) so that's traceable. Only ids — the row also carries the
		// OAuth tokens.
		account: {
			create: {
				after: async (account) => {
					const a = account as { userId?: string; providerId?: string };
					securityLog("auth.account_created", "success", {
						userId: a?.userId,
						providerId: a?.providerId,
					});
				},
			},
		},
		session: {
			create: {
				// Every sign-in path (email, OAuth callback, admin impersonation)
				// ends here; impersonatedBy is set when an admin impersonates.
				after: async (session) => {
					const s = session as
						| {
								userId?: string;
								ipAddress?: string | null;
								userAgent?: string | null;
								impersonatedBy?: string | null;
						  }
						| undefined;
					securityLog(
						s?.impersonatedBy
							? "auth.impersonation_started"
							: "auth.session_created",
						"success",
						{
							userId: s?.userId,
							impersonatedBy: s?.impersonatedBy ?? undefined,
							ip: s?.ipAddress ?? undefined,
							userAgent: s?.userAgent ?? undefined,
						},
					);
				},
			},
			delete: {
				before: async (session) => {
					const s = session as { id?: string; userId?: string } | undefined;
					securityLog("auth.session_revoked", "success", {
						sessionId: s?.id,
						userId: s?.userId,
					});
				},
			},
		},
	},
});

export type Auth = typeof auth;
