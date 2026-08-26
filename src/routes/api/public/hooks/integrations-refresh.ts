import { createFileRoute } from "@tanstack/react-router";
import { eq, isNull, lt, or, type SQL } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { db } from "@/db/index";
import { integrationAccounts, integrationCache } from "@/db/schema";
import { runProviderFetch } from "@/lib/integrations/dispatch.server";

// Cron: refresca integraciones stale (>6h) de todas las cuentas.
// Protegido con Authorization: Bearer $CRON_SECRET — sin sesión de usuario.
// Writes multi-statement van por db.batch: neon-http no soporta db.transaction.

const STALE_MS = 6 * 60 * 60 * 1000;
const MAX_ACCOUNTS = 100;
type Batch = [BatchItem<"pg">, ...Array<BatchItem<"pg">>];

export const Route = createFileRoute("/api/public/hooks/integrations-refresh")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				const secret = process.env.CRON_SECRET;
				if (
					!secret ||
					request.headers.get("authorization") !== `Bearer ${secret}`
				) {
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

				const accounts = await db
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
			},
		},
	},
});
