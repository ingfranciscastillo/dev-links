import { createFileRoute } from "@tanstack/react-router";
import { and, desc, eq, gte } from "drizzle-orm";
import { db } from "@/db/index";
import { linkClicks, pageViews, profiles } from "@/db/schema";
import { resolveSource } from "@/lib/api/analytics.functions";
import { auth } from "@/lib/auth";

const ALLOWED_DAYS = new Set([7, 30, 90]);

function csvCell(value: string | number | null): string {
	const s = value === null ? "" : String(value);
	if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
	return s;
}

function toCsv(rows: Array<Array<string | number | null>>): string {
	return rows.map((row) => row.map(csvCell).join(",")).join("\n");
}

async function handleExport(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) return new Response("Unauthorized", { status: 401 });

	const userId = session.user.id;
	const [profile] = await db
		.select({ plan: profiles.plan })
		.from(profiles)
		.where(eq(profiles.id, userId))
		.limit(1);
	if (profile?.plan !== "pro") {
		return new Response("Analytics export is a Pro feature", { status: 403 });
	}

	const url = new URL(request.url);
	const type = url.searchParams.get("type");
	const daysParam = Number(url.searchParams.get("days"));
	const days = ALLOWED_DAYS.has(daysParam) ? daysParam : 30;
	const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

	if (type === "views") {
		const rows = await db
			.select({
				viewedAt: pageViews.viewedAt,
				path: pageViews.path,
				referrer: pageViews.referrer,
				source: pageViews.source,
				device: pageViews.device,
				browser: pageViews.browser,
				os: pageViews.os,
				country: pageViews.country,
			})
			.from(pageViews)
			.where(
				and(
					eq(pageViews.profileUserId, userId),
					gte(pageViews.viewedAt, since),
				),
			)
			.orderBy(desc(pageViews.viewedAt))
			.limit(10_000);

		const csv = toCsv([
			["viewed_at", "path", "source", "device", "browser", "os", "country"],
			...rows.map((r) => [
				r.viewedAt.toISOString(),
				r.path,
				resolveSource(r.source, r.referrer),
				r.device,
				r.browser,
				r.os,
				r.country,
			]),
		]);

		return new Response(csv, {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="devlinks-views-${days}d.csv"`,
			},
		});
	}

	if (type === "clicks") {
		const rows = await db
			.select({
				clickedAt: linkClicks.clickedAt,
				linkTitle: linkClicks.linkTitle,
				linkUrl: linkClicks.linkUrl,
				referrer: linkClicks.referrer,
				source: linkClicks.source,
				device: linkClicks.device,
				browser: linkClicks.browser,
				os: linkClicks.os,
				country: linkClicks.country,
			})
			.from(linkClicks)
			.where(
				and(
					eq(linkClicks.profileUserId, userId),
					gte(linkClicks.clickedAt, since),
				),
			)
			.orderBy(desc(linkClicks.clickedAt))
			.limit(10_000);

		const csv = toCsv([
			[
				"clicked_at",
				"link_title",
				"link_url",
				"source",
				"device",
				"browser",
				"os",
				"country",
			],
			...rows.map((r) => [
				r.clickedAt.toISOString(),
				r.linkTitle,
				r.linkUrl,
				resolveSource(r.source, r.referrer),
				r.device,
				r.browser,
				r.os,
				r.country,
			]),
		]);

		return new Response(csv, {
			headers: {
				"Content-Type": "text/csv; charset=utf-8",
				"Content-Disposition": `attachment; filename="devlinks-clicks-${days}d.csv"`,
			},
		});
	}

	return new Response("Bad request", { status: 400 });
}

export const Route = createFileRoute("/api/analytics/export")({
	server: {
		handlers: {
			GET: ({ request }) => handleExport(request),
		},
	},
});
