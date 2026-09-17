import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db/index";
import { linkClicks, pageViews, profiles } from "@/db/schema";
import { knownSourceFromHostname } from "@/lib/analytics-sources";
import { ensureSession } from "@/lib/auth.functions";

export type AnalyticsSummary = {
	plan: string;
	totals: {
		views: number;
		clicks: number;
		ctr: number;
		uniqueVisitors: number;
	};
	// % change vs. the prior window of the same length. `null` means there
	// was no activity in the prior window to compare against.
	changes: {
		views: number | null;
		clicks: number | null;
		ctr: number | null;
		uniqueVisitors: number | null;
	};
	daily: Array<{ date: string; views: number; clicks: number }>;
	visitorBreakdown: { new: number; returning: number };
	devices: Array<{ name: string; value: number }>;
	browsers: Array<{ name: string; value: number }>;
	os: Array<{ name: string; value: number }>;
	countries: Array<{ name: string; value: number }>;
	hourly: Array<{ hour: number; views: number }>;
	topLinks: Array<{ title: string; clicks: number }>;
	topReferrers: Array<{ source: string; visits: number }>;
	topLinksBySource: Array<{ link: string; source: string; clicks: number }>;
};

export type AnalyticsSummaryLite = { views: number; clicks: number };

const VIEW_WHERE = (userId: string, since: Date) =>
	and(eq(pageViews.profileUserId, userId), gte(pageViews.viewedAt, since));
const CLICK_WHERE = (userId: string, since: Date) =>
	and(eq(linkClicks.profileUserId, userId), gte(linkClicks.clickedAt, since));
const VIEW_WHERE_BETWEEN = (userId: string, since: Date, until: Date) =>
	and(
		eq(pageViews.profileUserId, userId),
		gte(pageViews.viewedAt, since),
		lt(pageViews.viewedAt, until),
	);
const CLICK_WHERE_BETWEEN = (userId: string, since: Date, until: Date) =>
	and(
		eq(linkClicks.profileUserId, userId),
		gte(linkClicks.clickedAt, since),
		lt(linkClicks.clickedAt, until),
	);

// null = no baseline to compare against, not a 0% change.
function pctChange(current: number, previous: number): number | null {
	if (previous === 0) return current === 0 ? 0 : null;
	return Number((((current - previous) / previous) * 100).toFixed(1));
}

// `source` (set at insert time from the UA or an internal-nav tag) wins when
// present — it's the only signal for in-app browsers that strip the
// referrer entirely. Otherwise fall back to the referrer's hostname, mapped
// to a known app name where the redirect domain gives it away.
export function resolveSource(
	source: string | null,
	ref: string | null,
): string {
	if (source) return source;
	if (!ref) return "direct";
	try {
		const hostname = new URL(ref).hostname.replace(/^www\./, "");
		return knownSourceFromHostname(hostname) ?? hostname;
	} catch {
		return "other";
	}
}

// Fecha UTC (YYYY-MM-DD) de un timestamptz, igual que toISOString().slice(0,10).
const dayExpr = sql<string>`to_char(${pageViews.viewedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
const hourExpr = sql<number>`extract(hour from ${pageViews.viewedAt})::int`;
const topLinkExpr = sql<string>`coalesce(nullif(${linkClicks.linkTitle}, ''), ${linkClicks.linkUrl})`;

export const ANALYTICS_RANGE_DAYS = [7, 30, 90] as const;
export type AnalyticsRangeDays = (typeof ANALYTICS_RANGE_DAYS)[number];

export const getMyAnalytics = createServerFn({ method: "GET" })
	.validator(
		z.object({ days: z.union([z.literal(7), z.literal(30), z.literal(90)]) })
			.parse,
	)
	.handler(async ({ data }): Promise<AnalyticsSummary> => {
		const session = await ensureSession();
		const userId = session.user.id;
		const days = data.days;

		const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
		const previousSince = new Date(
			since.getTime() - days * 24 * 60 * 60 * 1000,
		);

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
				previousVisitorRows,
				[previousViewsRow],
				[previousClicksRow],
				visitorDayRows,
				linkReferrerRows,
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
						source: pageViews.source,
						visits: sql<number>`count(*)`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(pageViews.referrer, pageViews.source)
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
				db
					.select({
						v: sql<number>`count(DISTINCT ${pageViews.ipHash})`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE_BETWEEN(userId, previousSince, since)),
				db
					.select({ count: sql<number>`count(*)`.mapWith(Number) })
					.from(pageViews)
					.where(VIEW_WHERE_BETWEEN(userId, previousSince, since)),
				db
					.select({ count: sql<number>`count(*)`.mapWith(Number) })
					.from(linkClicks)
					.where(CLICK_WHERE_BETWEEN(userId, previousSince, since)),
				// ipHash rotates weekly (see analytics-parse.server.ts), so "returning"
				// here only catches visitors seen on 2+ distinct days inside the same
				// ISO week — a real repeat visitor crossing a week boundary still
				// looks new. Honest floor on "returning", not an exact count.
				db
					.select({
						ipHash: pageViews.ipHash,
						days: sql<number>`count(distinct ${dayExpr})`.mapWith(Number),
					})
					.from(pageViews)
					.where(VIEW_WHERE(userId, since))
					.groupBy(pageViews.ipHash),
				// Which source drives clicks on which link — cheap because
				// linkClicks already carries its own referrer per row.
				db
					.select({
						title: topLinkExpr,
						referrer: linkClicks.referrer,
						source: linkClicks.source,
						clicks: sql<number>`count(*)`.mapWith(Number),
					})
					.from(linkClicks)
					.where(CLICK_WHERE(userId, since))
					.groupBy(topLinkExpr, linkClicks.referrer, linkClicks.source)
					.orderBy(sql`count(*) desc`)
					.limit(500),
			]);

			const plan = profileRow[0]?.plan ?? "free";

			// Serie diaria completa (con ceros incluidos para el rango elegido).
			const dailyMap = new Map<string, { views: number; clicks: number }>();
			for (let i = days - 1; i >= 0; i--) {
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
				const source = resolveSource(r.source, r.referrer);
				refMap.set(source, (refMap.get(source) ?? 0) + r.visits);
			}
			const topReferrers = Array.from(refMap.entries())
				.map(([source, visits]) => ({ source, visits }))
				.sort((a, b) => b.visits - a.visits)
				.slice(0, 8);

			// Combos link×fuente: misma resolución de hostname, agregados por par.
			const linkSourceMap = new Map<string, number>();
			for (const r of linkReferrerRows) {
				const key = `${r.title}||${resolveSource(r.source, r.referrer)}`;
				linkSourceMap.set(key, (linkSourceMap.get(key) ?? 0) + r.clicks);
			}
			const topLinksBySource = Array.from(linkSourceMap.entries())
				.map(([key, clicks]) => {
					const [link, source] = key.split("||");
					return { link, source, clicks };
				})
				.sort((a, b) => b.clicks - a.clicks)
				.slice(0, 8);

			const totalViews = dailyViewRows.reduce((acc, r) => acc + r.views, 0);
			const totalClicks = dailyClickRows.reduce((acc, r) => acc + r.clicks, 0);
			const ctr = totalViews
				? Number(((totalClicks / totalViews) * 100).toFixed(1))
				: 0;
			const uniqueVisitors = visitorRows[0]?.v ?? 0;

			const previousViews = previousViewsRow?.count ?? 0;
			const previousClicks = previousClicksRow?.count ?? 0;
			const previousUniqueVisitors = previousVisitorRows[0]?.v ?? 0;
			const previousCtr = previousViews
				? Number(((previousClicks / previousViews) * 100).toFixed(1))
				: 0;

			const returning = visitorDayRows.filter((r) => r.days > 1).length;
			const visitorBreakdown = {
				new: Math.max(visitorDayRows.length - returning, 0),
				returning,
			};

			return {
				plan,
				totals: {
					views: totalViews,
					clicks: totalClicks,
					ctr,
					uniqueVisitors,
				},
				changes: {
					views: pctChange(totalViews, previousViews),
					clicks: pctChange(totalClicks, previousClicks),
					ctr: pctChange(ctr, previousCtr),
					uniqueVisitors: pctChange(uniqueVisitors, previousUniqueVisitors),
				},
				daily: Array.from(dailyMap.entries()).map(([date, x]) => ({
					date,
					...x,
				})),
				visitorBreakdown,
				devices: deviceRows,
				browsers: browserRows,
				os: osRows,
				countries: countryRows,
				hourly,
				topLinks: topLinkRows,
				topReferrers,
				topLinksBySource,
			};
		} catch (err) {
			console.warn("[analytics] getMyAnalytics failed:", err);
			return {
				plan: "free",
				totals: { views: 0, clicks: 0, ctr: 0, uniqueVisitors: 0 },
				changes: { views: null, clicks: null, ctr: null, uniqueVisitors: null },
				daily: [],
				visitorBreakdown: { new: 0, returning: 0 },
				devices: [],
				browsers: [],
				os: [],
				countries: [],
				hourly: [],
				topLinks: [],
				topReferrers: [],
				topLinksBySource: [],
			};
		}
	});

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
