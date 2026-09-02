import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import {
	checkout,
	dodopayments,
	portal,
	webhooks,
} from "@dodopayments/better-auth";
import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins/admin";
import { username } from "better-auth/plugins/username";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import DodoPayments from "dodopayments";
import * as authSchema from "@/db/auth-schema";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";
import { sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/site";

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
				html: `<p>Hi ${user.name ?? ""},</p><p>Click the link below to reset your password. It expires in 1 hour.</p><p><a href="${url}">${url}</a></p>`,
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
				html: `<p>Welcome to dev-links, ${user.name ?? ""}.</p><p>Confirm your email: <a href="${url}">${url}</a></p>`,
				text: `Verify your email: ${url}`,
			});
		},
	},

	socialProviders,

	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ["github", "google"],
		},
	},

	plugins: [
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
			createCustomerOnSignUp: true,
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
		expiresIn: 60 * 60 * 24 * 7,
		updateAge: 60 * 60 * 24,
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
		customRules: {
			"/api/auth/sign-in/email": { window: 60, max: 5 },
			"/api/auth/sign-up/email": { window: 60, max: 3 },
			"/api/auth/forget-password": { window: 60, max: 3 },
			"/api/auth/reset-password": { window: 60, max: 3 },
			"/api/auth/verify-email": { window: 60, max: 5 },
			"/api/auth/sign-in/social": { window: 60, max: 10 },
			"/api/auth/sign-out": false,
		},
	},

	trustedOrigins,

	advanced: {
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

	databaseHooks: {
		session: {
			create: {
				after: async (ctx) => {
					const data = ctx.data as { userId?: string };
					console.info("[auth] session.created", { userId: data?.userId });
				},
			},
			delete: {
				before: async (ctx) => {
					const data = ctx.data as { id?: string };
					console.info("[auth] session.revoked", { sessionId: data?.id });
				},
			},
		},
		user: {
			update: {
				after: async (ctx) => {
					const data = ctx.data as { id: string; email: string };
					const oldData = ctx.oldData as { email?: string } | undefined;
					if (oldData?.email !== data.email) {
						console.info("[auth] user.email_changed", { userId: data.id });
					}
				},
			},
		},
	},
});

export type Auth = typeof auth;
