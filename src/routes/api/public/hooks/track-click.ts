import { createFileRoute } from "@tanstack/react-router";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { user as userTable } from "@/db/auth-schema";
import { db } from "@/db/index";
import { linkClicks, links } from "@/db/schema";
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

// url/title are still accepted from older clients but ignored: the endpoint
// is unauthenticated, so the link's URL and title come from the DB row, and
// the click only counts if linkId is an active link owned by that profile.
// Otherwise anyone could write arbitrary rows into another user's analytics.
const bodySchema = z.object({
	username: z.string().min(1).max(64),
	linkId: z.uuid(),
	url: z.string().max(2048).optional().nullable(),
	title: z.string().max(200).optional().nullable(),
	referrer: z.string().max(1024).optional().nullable(),
});

export const Route = createFileRoute("/api/public/hooks/track-click")({
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

				const [link] = await db
					.select({ userId: links.userId, url: links.url, title: links.title })
					.from(links)
					.innerJoin(userTable, eq(userTable.id, links.userId))
					.where(
						and(
							eq(links.id, payload.linkId),
							eq(links.active, true),
							sql`lower(${userTable.username}) = ${payload.username.toLowerCase()}`,
						),
					)
					.limit(1);

				if (!link) return new Response("ok");

				const ip = extractIP(request);
				if (
					!rateLimit(
						`click:${ip}:${link.userId}`,
						RATE_LIMIT_WINDOW_MS,
						RATE_LIMIT_MAX,
					)
				) {
					return new Response("ok"); // no signal to the caller, just drop
				}

				const ua = request.headers.get("user-agent") || "";
				const parsed = parseUA(ua);
				const source = detectInAppSource(ua);

				try {
					await db.insert(linkClicks).values({
						profileUserId: link.userId,
						linkId: payload.linkId,
						linkUrl: link.url,
						linkTitle: link.title,
						ipHash: hashIP(ip),
						ua: ua.slice(0, 512),
						device: parsed.device,
						browser: parsed.browser,
						os: parsed.os,
						country: extractCountry(request),
						referrer: payload.referrer || null,
						source: source || null,
					});
				} catch (err) {
					console.warn("[track-click] insert failed:", err);
				}

				return new Response("ok");
			},
		},
	},
});
