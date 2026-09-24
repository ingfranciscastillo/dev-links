import { createFileRoute } from "@tanstack/react-router";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { user as userTable } from "@/db/auth-schema";
import { db } from "@/db/index";
import { pageViews, profiles } from "@/db/schema";
import {
	extractCountry,
	extractIP,
	hashIP,
	parseUA,
} from "@/lib/analytics-parse.server";
import { detectInAppSource } from "@/lib/analytics-sources";
import { methodNotAllowed, requireJson } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit.server";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 30;

const bodySchema = z.object({
	username: z.string().min(1).max(64),
	path: z.string().max(512).optional().nullable(),
	referrer: z.string().max(1024).optional().nullable(),
	// Explicit internal-nav tag (e.g. "discover") — document.referrer doesn't
	// update on client-side route transitions, so the origin page passes it.
	source: z.string().max(32).optional().nullable(),
});

export const Route = createFileRoute("/api/public/hooks/track-view")({
	server: {
		handlers: {
			...methodNotAllowed(["POST"]),
			POST: async ({ request }) => {
				const unsupported = requireJson(request);
				if (unsupported) return unsupported;
				let payload: z.infer<typeof bodySchema>;
				try {
					payload = bodySchema.parse(await request.json());
				} catch {
					return new Response("Bad request", { status: 400 });
				}

				const [profile] = await db
					.select({ id: profiles.id })
					.from(profiles)
					.innerJoin(userTable, eq(userTable.id, profiles.id))
					.where(
						sql`lower(${userTable.username}) = ${payload.username.toLowerCase()}`,
					)
					.limit(1);

				if (!profile) return new Response("ok"); // silently ignore unknown

				const ip = extractIP(request);
				if (
					!rateLimit(
						`view:${ip}:${profile.id}`,
						RATE_LIMIT_WINDOW_MS,
						RATE_LIMIT_MAX,
					)
				) {
					return new Response("ok"); // no signal to the caller, just drop
				}

				const ua = request.headers.get("user-agent") || "";
				const parsed = parseUA(ua);
				const source = payload.source || detectInAppSource(ua);

				try {
					await db.insert(pageViews).values({
						profileUserId: profile.id,
						ipHash: hashIP(ip),
						ua: ua.slice(0, 512),
						device: parsed.device,
						browser: parsed.browser,
						os: parsed.os,
						country: extractCountry(request),
						referrer: payload.referrer || null,
						source: source || null,
						path: payload.path || null,
					});
				} catch (err) {
					console.warn("[track-view] insert failed:", err);
				}

				return new Response("ok");
			},
		},
	},
});
