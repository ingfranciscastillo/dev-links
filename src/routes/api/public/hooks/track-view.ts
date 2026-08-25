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

const bodySchema = z.object({
	username: z.string().min(1).max(64),
	path: z.string().max(512).optional().nullable(),
	referrer: z.string().max(1024).optional().nullable(),
});

export const Route = createFileRoute("/api/public/hooks/track-view")({
	server: {
		handlers: {
			POST: async ({ request }) => {
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

				const ua = request.headers.get("user-agent") || "";
				const parsed = parseUA(ua);

				try {
					await db.insert(pageViews).values({
						profileUserId: profile.id,
						ipHash: hashIP(extractIP(request)),
						ua: ua.slice(0, 512),
						device: parsed.device,
						browser: parsed.browser,
						os: parsed.os,
						country: extractCountry(request),
						referrer: payload.referrer || null,
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
