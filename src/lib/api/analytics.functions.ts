import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/index";
import { linkClicks, pageViews, profiles } from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";

export type AnalyticsSummary = {
	plan: string;
	totals: {
		views: number;
		clicks: number;
		ctr: number;
		uniqueVisitors: number;
	};
	daily: Array<{ date: string; views: number; clicks: number }>;
	devices: Array<{ name: string; value: number }>;
	browsers: Array<{ name: string; value: number }>;
	os: Array<{ name: string; value: number }>;
	countries: Array<{ name: string; value: number }>;
	hourly: Array<{ hour: number; views: number }>;
	topLinks: Array<{ title: string; clicks: number }>;
	topReferrers: Array<{ source: string; visits: number }>;
};

export type AnalyticsSummaryLite = { views: number; clicks: number };

function count<T extends string | null>(
	rows: Array<{ v: T }>,
): Array<{ name: string; value: number }> {
	const map = new Map<string, number>();
	for (const r of rows) {
		const k = (r.v ?? "Unknown") as string;
		map.set(k, (map.get(k) ?? 0) + 1);
	}
	return Array.from(map.entries())
		.map(([name, value]) => ({ name, value }))
		.sort((a, b) => b.value - a.value)
		.slice(0, 12);
}

export const getMyAnalytics = createServerFn({ method: "GET" }).handler(
	async (): Promise<AnalyticsSummary> => {
		const session = await ensureSession();
		const userId = session.user.id;

		const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		const empty: AnalyticsSummary = {
			plan: "free",
			totals: { views: 0, clicks: 0, ctr: 0, uniqueVisitors: 0 },
			daily: [],
			devices: [],
			browsers: [],
			os: [],
			countries: [],
			hourly: [],
			topLinks: [],
			topReferrers: [],
		};

		try {
			const [profileRow, views, clicks] = await Promise.all([
				db
					.select({ plan: profiles.plan })
					.from(profiles)
					.where(eq(profiles.id, userId))
					.limit(1),
				db
					.select({
						viewedAt: pageViews.viewedAt,
						device: pageViews.device,
						browser: pageViews.browser,
						os: pageViews.os,
						country: pageViews.country,
						referrer: pageViews.referrer,
						ipHash: pageViews.ipHash,
					})
					.from(pageViews)
					.where(
						and(
							eq(pageViews.profileUserId, userId),
							gte(pageViews.viewedAt, since),
						),
					)
					.limit(20000),
				db
					.select({
						clickedAt: linkClicks.clickedAt,
						linkTitle: linkClicks.linkTitle,
						linkUrl: linkClicks.linkUrl,
					})
					.from(linkClicks)
					.where(
						and(
							eq(linkClicks.profileUserId, userId),
							gte(linkClicks.clickedAt, since),
						),
					)
					.limit(20000),
			]);

			const plan = profileRow[0]?.plan ?? "free";
			const v = views ?? [];
			const c = clicks ?? [];

			if (v.length === 0 && c.length === 0) {
				return { ...empty, plan };
			}

			// Daily buckets.
			const dailyMap = new Map<string, { views: number; clicks: number }>();
			for (let i = 29; i >= 0; i--) {
				const d = new Date();
				d.setUTCDate(d.getUTCDate() - i);
				dailyMap.set(d.toISOString().slice(0, 10), { views: 0, clicks: 0 });
			}
			for (const r of v) {
				const k = r.viewedAt.toISOString().slice(0, 10);
				const b = dailyMap.get(k);
				if (b) b.views++;
			}
			for (const r of c) {
				const k = r.clickedAt.toISOString().slice(0, 10);
				const b = dailyMap.get(k);
				if (b) b.clicks++;
			}

			// Hourly buckets.
			const hourly = Array.from({ length: 24 }, (_, hour) => ({
				hour,
				views: 0,
			}));
			for (const r of v) {
				const h = r.viewedAt.getUTCHours();
				hourly[h].views++;
			}

			// Top links.
			const linkMap = new Map<string, number>();
			for (const r of c) {
				const k = r.linkTitle || r.linkUrl;
				linkMap.set(k, (linkMap.get(k) ?? 0) + 1);
			}
			const topLinks = Array.from(linkMap.entries())
				.map(([title, clicks]) => ({ title, clicks }))
				.sort((a, b) => b.clicks - a.clicks)
				.slice(0, 10);

			// Referrers.
			const refMap = new Map<string, number>();
			for (const r of v) {
				const ref = r.referrer;
				let source = "direct";
				if (ref) {
					try {
						source = new URL(ref).hostname.replace(/^www\./, "");
					} catch {
						source = "other";
					}
				}
				refMap.set(source, (refMap.get(source) ?? 0) + 1);
			}
			const topReferrers = Array.from(refMap.entries())
				.map(([source, visits]) => ({ source, visits }))
				.sort((a, b) => b.visits - a.visits)
				.slice(0, 8);

			const uniqueVisitors = new Set(v.map((r) => r.ipHash).filter(Boolean))
				.size;
			const totalViews = v.length;
			const totalClicks = c.length;
			const ctr = totalViews
				? Number(((totalClicks / totalViews) * 100).toFixed(1))
				: 0;

			return {
				plan,
				totals: {
					views: totalViews,
					clicks: totalClicks,
					ctr,
					uniqueVisitors,
				},
				daily: Array.from(dailyMap.entries()).map(([date, x]) => ({
					date,
					...x,
				})),
				devices: count(v.map((r) => ({ v: r.device }))),
				browsers: count(v.map((r) => ({ v: r.browser }))),
				os: count(v.map((r) => ({ v: r.os }))),
				countries: count(v.map((r) => ({ v: r.country }))),
				hourly,
				topLinks,
				topReferrers,
			};
		} catch (err) {
			console.warn("[analytics] getMyAnalytics failed:", err);
			return empty;
		}
	},
);

export const getMyAnalyticsSummary = createServerFn({ method: "GET" })
	.validator(z.object({ days: z.number().int().positive().optional() }).parse)
	.handler(async ({ data }): Promise<AnalyticsSummaryLite> => {
		const session = await ensureSession();
		const userId = session.user.id;
		const days = data?.days ?? 7;
		const cutoff = new Date();
		cutoff.setDate(cutoff.getDate() - days);

		const [[viewsRow], [clicksRow]] = await Promise.all([
			db
				.select({ count: sql<number>`count(*)`.mapWith(Number) })
				.from(pageViews)
				.where(
					and(
						eq(pageViews.profileUserId, userId),
						gte(pageViews.viewedAt, cutoff),
					),
				),
			db
				.select({ count: sql<number>`count(*)`.mapWith(Number) })
				.from(linkClicks)
				.where(
					and(
						eq(linkClicks.profileUserId, userId),
						gte(linkClicks.clickedAt, cutoff),
					),
				),
		]);

		return { views: viewsRow?.count ?? 0, clicks: clicksRow?.count ?? 0 };
	});
