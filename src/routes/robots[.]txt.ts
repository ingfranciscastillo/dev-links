import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/site";

export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () => {
				const body = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /api/

Sitemap: ${SITE_URL}/sitemap.xml
`;

				return new Response(body, {
					headers: {
						"Content-Type": "text/plain; charset=utf-8",
						"Cache-Control": "public, max-age=3600",
					},
				});
			},
		},
	},
});
