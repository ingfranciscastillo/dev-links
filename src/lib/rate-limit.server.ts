// Runs on the server only. Do NOT import from client-reachable modules at module scope.
//
// Fixed-window rate limiter backed by Postgres (request_limits table). The
// previous in-memory version was per serverless instance and reset on every
// cold start, so on Vercel it barely limited anything.
//
// One atomic upsert per call: insert the key with count 1, or bump the count —
// resetting it when the window has elapsed — and read it back. No
// read-then-write race between concurrent requests.

import { createHmac } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db/index";
import { requestLimits } from "@/db/schema";

// Keys are stored as "<scope>:<hmac(identifier)>" so client IPs never land
// in the database in clear.
export function limitKey(scope: string, identifier: string): string {
	const digest = createHmac("sha256", process.env.BETTER_AUTH_SECRET ?? "")
		.update(identifier)
		.digest("hex")
		.slice(0, 32);
	return `${scope}:${digest}`;
}

/**
 * Counts one request against `scope`/`identifier` and returns whether it is
 * within `max` per `windowMs`. Fails open (returns true) if the database is
 * unavailable, so a DB hiccup never blocks legitimate traffic.
 */
export async function consumeRateLimit(
	scope: string,
	identifier: string,
	windowMs: number,
	max: number,
): Promise<boolean> {
	const key = limitKey(scope, identifier);
	const windowSeconds = Math.max(1, Math.round(windowMs / 1000));
	const expired = sql`${requestLimits.windowStart} < now() - make_interval(secs => ${windowSeconds})`;

	try {
		const [row] = await db
			.insert(requestLimits)
			.values({ key, count: 1 })
			.onConflictDoUpdate({
				target: requestLimits.key,
				set: {
					count: sql`case when ${expired} then 1 else ${requestLimits.count} + 1 end`,
					windowStart: sql`case when ${expired} then now() else ${requestLimits.windowStart} end`,
				},
			})
			.returning({ count: requestLimits.count });

		// Opportunistic cleanup of long-expired windows (~1% of calls).
		if (Math.random() < 0.01) {
			void db
				.delete(requestLimits)
				.where(sql`${requestLimits.windowStart} < now() - interval '1 day'`)
				.catch(() => {});
		}

		return (row?.count ?? 1) <= max;
	} catch (err) {
		console.warn("[rate-limit] check failed, allowing request:", err);
		return true;
	}
}
