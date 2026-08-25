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

const VIEW_WHERE = (userId: string, since: Date) =>
	and(eq(pageViews.profileUserId, userId), gte(pageViews.viewedAt, since));
const CLICK_WHERE = (userId: string, since: Date) =>
	and(eq(linkClicks.profileUserId, userId), gte(linkClicks.clickedAt, since));

// Fecha UTC (YYYY-MM-DD) de un timestamptz, igual que toISOString().slice(0,10).
const dayExpr = sql<string>`to_char(${pageViews.viewedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
const hourExpr = sql<number>`extract(hour from ${pageViews.viewedAt})::int`;
const topLinkExpr = sql<string>`coalesce(nullif(${linkClicks.linkTitle}, ''), ${linkClicks.linkUrl})`;

export const getMyAnalytics = createServerFn({ method: "GET" }).handler(
	async (): Promise<AnalyticsSummary> => {
		const session = await ensureSession();
		const userId = session.user.id;

		const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

		try {
			const [
				profileRow,
				dailyViewRows,
				dailyClickRows,
				hourlyRows,
				deviceRows,
				browserRows,
				osRows,
				countryRows,
				referrerRows,
				topLinkRows,
				visitorRows,
			] = await Promise.all([
				db
					.select({ plan: profiles.plan })
					.from(profiles)
					.where(eq(profiles.id, userId))
					.limit(1),
				db
					.select({
						date: dayExpr,
						views: sql<number>`count(*)`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(dayExpr),
				db
					.select({
						date: sql<string>`to_char(${linkClicks.clickedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
						clicks: sql<number>`count(*)`.mapWith(Number),
					})
					.from(linkClicks)
					.where(CLICK_WHERE(userId, since))
					.groupBy(
						sql`to_char(${linkClicks.clickedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`,
					),
				db
					.select({
						hour: hourExpr,
						views: sql<number>`count(*)`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(hourExpr),
				db
					.select({
						name: sql<string>`coalesce(${pageViews.device}, 'Unknown')`,
						value: sql<number>`count(*)`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(sql`coalesce(${pageViews.device}, 'Unknown')`)
					.orderBy(sql`count(*) desc`)
					.limit(12),
				db
					.select({
						name: sql<string>`coalesce(${pageViews.browser}, 'Unknown')`,
						value: sql<number>`count(*)`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(sql`coalesce(${pageViews.browser}, 'Unknown')`)
					.orderBy(sql`count(*) desc`)
					.limit(12),
				db
					.select({
						name: sql<string>`coalesce(${pageViews.os}, 'Unknown')`,
						value: sql<number>`count(*)`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(sql`coalesce(${pageViews.os}, 'Unknown')`)
					.orderBy(sql`count(*) desc`)
					.limit(12),
				db
					.select({
						name: sql<string>`coalesce(${pageViews.country}, 'Unknown')`,
						value: sql<number>`count(*)`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(sql`coalesce(${pageViews.country}, 'Unknown')`)
					.orderBy(sql`count(*) desc`)
					.limit(12),
				// Cardinalidad baja: se agrupa crudo en SQL y el hostname se
				// resuelve en JS sobre los pocos grupos resultantes.
				db
					.select({
						referrer: pageViews.referrer,
						visits: sql<number>`count(*)`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(pageViews.referrer)
					.orderBy(sql`count(*) desc`)
					.limit(500),
				db
					.select({
						title: topLinkExpr,
						clicks: sql<number>`count(*)`.mapWith(Number),
					})
					.from(linkClicks)
					.where(CLICK_WHERE(userId, since))
					.groupBy(topLinkExpr)
					.orderBy(sql`count(*) desc`)
					.limit(10),
				db
					.select({
						v: sql<number>`count(DISTINCT ${pageViews.ipHash})`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since)),
			]);

			const plan = profileRow[0]?.plan ?? "free";

			// Serie diaria completa (30 días con ceros incluidos).
			const dailyMap = new Map<string, { views: number; clicks: number }>();
			for (let i = 29; i >= 0; i--) {
				const d = new Date();
				d.setUTCDate(d.getUTCDate() - i);
				dailyMap.set(d.toISOString().slice(0, 10), { views: 0, clicks: 0 });
			}
			for (const r of dailyViewRows) {
				const b = dailyMap.get(r.date);
				if (b) b.views = r.views;
			}
			for (const r of dailyClickRows) {
				const b = dailyMap.get(r.date);
				if (b) b.clicks = r.clicks;
			}

			// Buckets horarios (24 horas con ceros incluidos).
			const hourly = Array.from({ length: 24 }, (_, hour) => ({
				hour,
				views: 0,
			}));
			for (const r of hourlyRows) {
				if (r.hour >= 0 && r.hour < 24) hourly[r.hour].views = r.views;
			}

			// Referrers: hostname desde grupos crudos.
			const refMap = new Map<string, number>();
			for (const r of referrerRows) {
				const ref = r.referrer;
				let source = "direct";
				if (ref) {
					try {
						source = new URL(ref).hostname.replace(/^www\./, "");
					} catch {
						source = "other";
					}
				}
				refMap.set(source, (refMap.get(source) ?? 0) + r.visits);
			}
			const topReferrers = Array.from(refMap.entries())
				.map(([source, visits]) => ({ source, visits }))
				.sort((a, b) => b.visits - a.visits)
				.slice(0, 8);

			const totalViews = dailyViewRows.reduce((acc, r) => acc + r.views, 0);
			const totalClicks = dailyClickRows.reduce((acc, r) => acc + r.clicks, 0);
			const ctr = totalViews
				? Number(((totalClicks / totalViews) * 100).toFixed(1))
				: 0;

			return {
				plan,
				totals: {
					views: totalViews,
					clicks: totalClicks,
					ctr,
					uniqueVisitors: visitorRows[0]?.v ?? 0,
				},
				daily: Array.from(dailyMap.entries()).map(([date, x]) => ({
					date,
					...x,
				})),
				devices: deviceRows,
				browsers: browserRows,
				os: osRows,
				countries: countryRows,
				hourly,
				topLinks: topLinkRows,
				topReferrers,
			};
		} catch (err) {
			console.warn("[analytics] getMyAnalytics failed:", err);
			return {
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
