import { createServerFn } from "@tanstack/react-start";
import { and, asc, eq } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";
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
	return rows.map((r) => ({
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

		if (Number.isFinite(limits.integrations)) {
			const existing = await db
				.select({ provider: integrationAccounts.provider })
				.from(integrationAccounts)
				.where(eq(integrationAccounts.userId, userId));
			const alreadyConnected = existing.some(
				(r) => r.provider === data.provider,
			);
			if (!alreadyConnected && existing.length >= limits.integrations) {
				throw new Error(
					`Free plan is limited to ${limits.integrations} connected integrations. Upgrade to Pro for unlimited.`,
				);
			}
		}

		await db
			.insert(integrationAccounts)
			.values({
				userId,
				provider: data.provider,
				handle: data.handle,
				config: data.config,
				lastError: null,
			})
			.onConflictDoUpdate({
				target: [integrationAccounts.userId, integrationAccounts.provider],
				set: {
					handle: data.handle,
					config: data.config,
					lastError: null,
					updatedAt: new Date(),
				},
			});
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
