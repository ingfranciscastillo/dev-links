import { createHash, timingSafeEqual } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { eq, isNull, lt, or, type SQL } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db/index";
import { integrationAccounts, integrationCache } from "@/db/schema";
import { runProviderFetch } from "@/lib/integrations/dispatch.server";
import type { Provider } from "@/lib/integrations/types";

// Cron: refresca integraciones stale (>24h) de todas las cuentas.
// Protegido con Authorization: Bearer $CRON_SECRET — sin sesión de usuario.
// Vercel Cron sólo invoca por GET y agrega ese header automáticamente
// cuando CRON_SECRET está seteado como env var del proyecto.
// Corre 1x/día (03:00 UTC, ±59min): límite del plan Hobby, que no permite
// crons más frecuentes que diarios. Con plan Pro se puede bajar a cada 6h.
// Writes multi-statement van por db.batch: neon-http no soporta db.transaction.

const STALE_MS = 24 * 60 * 60 * 1000;
const MAX_ACCOUNTS = 100;
type Batch = [BatchItem<"pg">, ...Array<BatchItem<"pg">>];

// Constant-time check so response timing doesn't leak how much of the
// secret a guess got right. Both sides are hashed first because
// timingSafeEqual needs equal-length buffers.
function isValidCronAuth(request: Request, secret: string): boolean {
	const digest = (value: string) => createHash("sha256").update(value).digest();
	return timingSafeEqual(
		digest(request.headers.get("authorization") ?? ""),
		digest(`Bearer ${secret}`),
	);
}

async function refreshStaleIntegrations(request: Request) {
	const secret = process.env.CRON_SECRET;
	if (!secret || !isValidCronAuth(request, secret)) {
		return Response.json(
			{ ok: false as const, error: "Unauthorized" },
			{ status: 401 },
		);
	}

	const staleCutoff = new Date(Date.now() - STALE_MS);
	const staleWhere: SQL | undefined = or(
		isNull(integrationAccounts.lastSyncedAt),
		lt(integrationAccounts.lastSyncedAt, staleCutoff),
	);

	const staleAccounts = await db
		.select({
			id: integrationAccounts.id,
			userId: integrationAccounts.userId,
			provider: integrationAccounts.provider,
			handle: integrationAccounts.handle,
			config: integrationAccounts.config,
		})
		.from(integrationAccounts)
		.where(staleWhere)
		.limit(MAX_ACCOUNTS);

	// "linkedin" stays in the DB enum (Postgres can't drop enum values) but
	// isn't a valid Provider anymore — skip any leftover row instead of
	// calling runProviderFetch with a provider it has no case for.
	const accounts = staleAccounts.filter(
		(a): a is typeof a & { provider: Provider } => a.provider !== "linkedin",
	);

	const results: Array<{
		id: string;
		provider: string;
		ok: boolean;
		error?: string;
	}> = [];

	for (const account of accounts) {
		try {
			const fetched = await runProviderFetch(account.provider, {
				handle: account.handle,
				config: (account.config ?? {}) as Record<string, unknown>,
			});

			const now = new Date();
			const statements: Array<BatchItem<"pg">> = [];
			for (const r of fetched) {
				statements.push(
					db
						.insert(integrationCache)
						.values({
							userId: account.userId,
							provider: account.provider,
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

			results.push({
				id: account.id,
				provider: account.provider,
				ok: true,
			});
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			// Stamp también en fallo: evita re-martillar un provider roto
			// en cada tick del cron; lastError conserva el motivo.
			await db
				.update(integrationAccounts)
				.set({
					lastSyncedAt: new Date(),
					lastError: message.slice(0, 500),
					updatedAt: new Date(),
				})
				.where(eq(integrationAccounts.id, account.id));

			results.push({
				id: account.id,
				provider: account.provider,
				ok: false,
				error: message.slice(0, 200),
			});
		}
	}

	return Response.json({
		ok: true as const,
		processed: results.length,
		results,
	});
}

export const Route = createFileRoute("/api/public/hooks/integrations-refresh")({
	server: {
		handlers: {
			// Vercel Cron Jobs invoke via GET; POST stays for manual/curl triggers.
			GET: ({ request }) => refreshStaleIntegrations(request),
			POST: ({ request }) => refreshStaleIntegrations(request),
		},
	},
});
