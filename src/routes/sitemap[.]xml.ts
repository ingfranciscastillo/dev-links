import { createFileRoute } from "@tanstack/react-router";
import { eq, sql } from "drizzle-orm";
import { user as authUserTable } from "@/db/auth-schema";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";
import { SITE_URL } from "@/lib/site";

const STATIC_PATHS = ["/", "/discover"];

function xmlEscape(value: string) {
	return value.replace(/&/g, "&amp;");
}

export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const rows = await db
					.select({
						username: authUserTable.username,
						updatedAt: profiles.updatedAt,
					})
					.from(profiles)
					.innerJoin(authUserTable, eq(authUserTable.id, profiles.id))
					.where(sql`${authUserTable.username} is not null`);

				const urls = [
					...STATIC_PATHS.map((path) => ({
						loc: `${SITE_URL}${path}`,
						lastmod: undefined as string | undefined,
						changefreq: "daily",
						priority: path === "/" ? "1.0" : "0.8",
					})),
					...rows.map((row) => ({
						loc: `${SITE_URL}/${xmlEscape(row.username as string)}`,
						lastmod: row.updatedAt.toISOString().slice(0, 10),
						changefreq: "daily",
						priority: "0.6",
					})),
				];

				const body = urls
					.map(
						(u) =>
							`  <url>\n    <loc>${u.loc}</loc>\n${
								u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ""
							}    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`,
					)
					.join("\n");

				const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;

				return new Response(xml, {
					headers: {
						"Content-Type": "application/xml; charset=utf-8",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
