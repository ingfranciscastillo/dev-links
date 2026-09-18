import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";
import { account as authAccount } from "@/db/auth-schema";
import { db } from "@/db/index";
import { integrationAccounts, integrationCache, profiles } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";
import { runProviderFetch } from "@/lib/integrations/dispatch.server";
import { PROVIDERS, type Provider } from "@/lib/integrations/types";
import { limitsFor } from "@/lib/plan-limits";

type Batch = [BatchItem<"pg">, ...Array<BatchItem<"pg">>];

const providerSchema = z.enum([...PROVIDERS] as [Provider, ...Provider[]]);

const upsertSchema = z.object({
	provider: providerSchema,
	handle: z.string().trim().min(1).max(120),
	config: z.record(z.string(), z.unknown()).default({}),
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

async function requireUserId(): Promise<string> {
	const session = await ensureSession();
	return session.user.id;
}

export const listMyIntegrationAccounts = createServerFn({
	method: "GET",
}).handler(async (): Promise<IntegrationAccount[]> => {
	const userId = await requireUserId();
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
			(r): r is typeof r & { provider: Provider } => r.provider !== "linkedin",
		)
		.map((r) => ({
			id: r.id,
			provider: r.provider,
			handle: r.handle,
			config: (r.config ?? {}) as Record<string, Json>,
			lastSyncedAt: r.lastSyncedAt ? r.lastSyncedAt.toISOString() : null,
			lastError: r.lastError,
			updatedAt: r.updatedAt.toISOString(),
		}));
});

export const upsertIntegrationAccount = createServerFn({ method: "POST" })
	.validator((input) => upsertSchema.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();

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
	.validator((input) => providerInputSchema.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
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
	.validator((input) => providerInputSchema.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();

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
export const autoConnectGithub = createServerFn({ method: "POST" }).handler(
	async (): Promise<{ connected: boolean; handle?: string }> => {
		const userId = await requireUserId();

		const [githubAccount] = await db
			.select({ accessToken: authAccount.accessToken })
			.from(authAccount)
			.where(
				and(
					eq(authAccount.userId, userId),
					eq(authAccount.providerId, "github"),
				),
			)
			.limit(1);

		if (!githubAccount?.accessToken) return { connected: false };

		try {
			const res = await fetch("https://api.github.com/user", {
				headers: {
					Authorization: `Bearer ${githubAccount.accessToken}`,
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
