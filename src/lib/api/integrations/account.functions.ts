import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, asc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";
import { account as authAccount } from "@/db/auth-schema";
import { db } from "@/db/index";
import { integrationAccounts, integrationCache, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { authMiddleware } from "@/lib/auth-middleware";
import { runProviderFetch } from "@/lib/integrations/dispatch.server";
import { REPO_SLUG_RE } from "@/lib/integrations/github.server";
import { SECRET_CONFIG_KEYS } from "@/lib/integrations/secrets.server";
import { PROVIDERS, type Provider } from "@/lib/integrations/types";
import { limitsFor } from "@/lib/plan-limits";

type Batch = [BatchItem<"pg">, ...Array<BatchItem<"pg">>];

const providerSchema = z.enum([...PROVIDERS] as [Provider, ...Provider[]]);

// These only connect through their OAuth callback, which verifies the handle
// against the token it obtained. Accepting them here would let a user claim
// any handle and write their own access_token into config.
const OAUTH_ONLY_PROVIDERS = new Set<Provider>([
	"dribbble",
	"pinterest",
	"producthunt",
]);

// config reaches runProviderFetch, so each provider only accepts the keys its
// fetcher reads. Pinned slugs use the same check github.server.ts applies.
const githubConfigSchema = z
	.object({
		pinned: z.array(z.string().max(100).regex(REPO_SLUG_RE)).max(6).optional(),
	})
	.strict();
const emptyConfigSchema = z.object({}).strict();

const upsertSchema = z
	.object({
		provider: providerSchema,
		handle: z.string().trim().min(1).max(120),
		config: z.record(z.string(), z.unknown()).default({}),
	})
	.transform((input, ctx) => {
		if (OAUTH_ONLY_PROVIDERS.has(input.provider)) {
			ctx.addIssue({
				code: "custom",
				path: ["provider"],
				message: "This integration can only be connected through OAuth",
			});
			return z.NEVER;
		}
		const configSchema =
			input.provider === "github" ? githubConfigSchema : emptyConfigSchema;
		const config = configSchema.safeParse(input.config);
		if (!config.success) {
			ctx.addIssue({
				code: "custom",
				path: ["config"],
				message: "Invalid integration config",
			});
			return z.NEVER;
		}
		return { ...input, config: config.data };
	});

const providerInputSchema = z.object({ provider: providerSchema });

export type Json =
	| string
	| number
	| boolean
	| null
	| Json[]
	| { [key: string]: Json };

export type IntegrationAccount = {
	id: string;
	provider: Provider;
	handle: string;
	config: Record<string, Json>;
	lastSyncedAt: string | null;
	lastError: string | null;
	updatedAt: string;
};

// OAuth callbacks (Dribbble/Pinterest/Product Hunt) keep the provider's
// tokens in `config` for the server-side fetchers. The dashboard never needs
// them, so they're dropped before `config` crosses into client JS.

function toClientConfig(config: unknown): Record<string, Json> {
	return Object.fromEntries(
		Object.entries((config ?? {}) as Record<string, Json>).filter(
			([key]) => !SECRET_CONFIG_KEYS.has(key),
		),
	);
}

export const listMyIntegrationAccounts = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }): Promise<IntegrationAccount[]> => {
		const { userId } = context;
		const rows = await db
			.select({
				id: integrationAccounts.id,
				provider: integrationAccounts.provider,
				handle: integrationAccounts.handle,
				config: integrationAccounts.config,
				lastSyncedAt: integrationAccounts.lastSyncedAt,
				lastError: integrationAccounts.lastError,
				updatedAt: integrationAccounts.updatedAt,
			})
			.from(integrationAccounts)
			.where(eq(integrationAccounts.userId, userId))
			.orderBy(asc(integrationAccounts.provider));
		// "linkedin" stays in the DB enum (Postgres can't drop enum values) but
		// isn't a valid Provider anymore — drop any leftover row instead of
		// showing an integration the UI no longer has a form for.
		return rows
			.filter(
				(r): r is typeof r & { provider: Provider } =>
					r.provider !== "linkedin",
			)
			.map((r) => ({
				id: r.id,
				provider: r.provider,
				handle: r.handle,
				config: toClientConfig(r.config),
				lastSyncedAt: r.lastSyncedAt ? r.lastSyncedAt.toISOString() : null,
				lastError: r.lastError,
				updatedAt: r.updatedAt.toISOString(),
			}));
	});

export const upsertIntegrationAccount = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => upsertSchema.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;

		const [planRow] = await db
			.select({ plan: profiles.plan })
			.from(profiles)
			.where(eq(profiles.id, userId))
			.limit(1);
		const limits = limitsFor(planRow?.plan);

		// Guarded INSERT...SELECT...WHERE instead of count-then-insert:
		// reconnecting an already-linked provider is always allowed (it's not
		// a new slot), a brand new provider only inserts while still under
		// the free-plan cap. Collapses the check and the write into one
		// statement, closing the window two concurrent requests could both
		// pass the count check in.
		const limitGuard = Number.isFinite(limits.integrations)
			? sql`(
					exists (
						select 1 from ${integrationAccounts}
						where ${integrationAccounts.userId} = ${userId}
							and ${integrationAccounts.provider} = ${data.provider}
					)
					or (select count(*)::int from ${integrationAccounts} where ${integrationAccounts.userId} = ${userId}) < ${limits.integrations}
				)`
			: sql`true`;

		const [row] = await db
			.insert(integrationAccounts)
			.select(sql`
				select
					gen_random_uuid(),
					${userId}::text,
					${data.provider}::integration_provider,
					${data.handle}::text,
					${JSON.stringify(data.config)}::jsonb,
					null::timestamptz,
					null::text,
					now(),
					now()
				where ${limitGuard}
			`)
			.onConflictDoUpdate({
				target: [integrationAccounts.userId, integrationAccounts.provider],
				set: {
					handle: data.handle,
					config: data.config,
					lastError: null,
					updatedAt: new Date(),
				},
			})
			.returning({ id: integrationAccounts.id });

		if (!row) {
			throw new Error(
				`Free plan is limited to ${limits.integrations} connected integrations. Upgrade to Pro for unlimited.`,
			);
		}
		return { ok: true as const };
	});

export const deleteIntegrationAccount = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => providerInputSchema.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		await db.batch([
			db
				.delete(integrationCache)
				.where(
					and(
						eq(integrationCache.userId, userId),
						eq(integrationCache.provider, data.provider),
					),
				),
			db
				.delete(integrationAccounts)
				.where(
					and(
						eq(integrationAccounts.userId, userId),
						eq(integrationAccounts.provider, data.provider),
					),
				),
		]);
		return { ok: true as const };
	});

export const refreshIntegration = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => providerInputSchema.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;

		const [account] = await db
			.select()
			.from(integrationAccounts)
			.where(
				and(
					eq(integrationAccounts.userId, userId),
					eq(integrationAccounts.provider, data.provider),
				),
			)
			.limit(1);

		if (!account) {
			throw new Error("Integration not configured");
		}

		// 60s cooldown.
		if (account.lastSyncedAt) {
			const elapsed = Date.now() - account.lastSyncedAt.getTime();
			if (elapsed < 60_000) {
				throw new Error(
					`Wait ${Math.ceil((60_000 - elapsed) / 1000)}s before syncing again`,
				);
			}
		}

		try {
			const results = await runProviderFetch(data.provider, {
				handle: account.handle,
				config: (account.config ?? {}) as Record<string, unknown>,
			});

			// Batch: un solo HTTP roundtrip y ejecución atómica en Neon —
			// si falla algún kind, no queda caché parcial marcado como
			// sincronizado; lastSyncedAt solo avanza con todo el set.
			const now = new Date();
			const statements: Array<BatchItem<"pg">> = [];
			for (const r of results) {
				statements.push(
					db
						.insert(integrationCache)
						.values({
							userId,
							provider: data.provider,
							kind: r.kind,
							payload: r.payload,
							fetchedAt: now,
							expiresAt: r.expiresInMs
								? new Date(Date.now() + r.expiresInMs)
								: null,
						})
						.onConflictDoUpdate({
							target: [
								integrationCache.userId,
								integrationCache.provider,
								integrationCache.kind,
							],
							set: {
								payload: r.payload,
								fetchedAt: now,
								expiresAt: r.expiresInMs
									? new Date(Date.now() + r.expiresInMs)
									: null,
							},
						}),
				);
			}
			statements.push(
				db
					.update(integrationAccounts)
					.set({
						lastSyncedAt: now,
						lastError: null,
						updatedAt: now,
					})
					.where(eq(integrationAccounts.id, account.id)),
			);
			await db.batch(statements as Batch);

			return { ok: true as const, kinds: results.map((r) => r.kind) };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			await db
				.update(integrationAccounts)
				.set({
					lastError: message.slice(0, 500),
					lastSyncedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(integrationAccounts.id, account.id));
			throw new Error(message);
		}
	});

// Solo se llama una vez, desde /_authenticated/onboarding, justo después de un
// signup nuevo por OAuth — si ese signup fue con GitHub, usa el access token
// que better-auth ya guardó en `account` para leer el username real (GitHub
// no lo expone como accountId, ese es el numeric id) y conectar la
// integración sin que el usuario tenga que repetir su username a mano.
export const autoConnectGithub = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.handler(
		async ({ context }): Promise<{ connected: boolean; handle?: string }> => {
			const { userId } = context;

			const [githubAccount] = await db
				.select({ id: authAccount.id })
				.from(authAccount)
				.where(
					and(
						eq(authAccount.userId, userId),
						eq(authAccount.providerId, "github"),
					),
				)
				.limit(1);

			if (!githubAccount) return { connected: false };

			try {
				// Tokens are encrypted at rest (account.encryptOAuthTokens), so
				// they go through better-auth to be decrypted, not read raw.
				const { accessToken } = await auth.api.getAccessToken({
					body: { accountId: githubAccount.id },
					headers: getRequestHeaders(),
				});
				if (!accessToken) return { connected: false };

				const res = await fetch("https://api.github.com/user", {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"User-Agent": "DevLinks",
						Accept: "application/vnd.github+json",
					},
				});
				if (!res.ok) return { connected: false };

				const profile = (await res.json()) as { login?: string };
				if (!profile.login) return { connected: false };

				await db
					.insert(integrationAccounts)
					.values({
						userId,
						provider: "github",
						handle: profile.login,
						config: {},
					})
					.onConflictDoNothing({
						target: [integrationAccounts.userId, integrationAccounts.provider],
					});

				return { connected: true, handle: profile.login };
			} catch {
				// GitHub caído/rate-limited: no debe bloquear el onboarding, el
				// usuario siempre puede conectar GitHub a mano después.
				return { connected: false };
			}
		},
	);
