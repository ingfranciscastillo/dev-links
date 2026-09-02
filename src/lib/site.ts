const rawSiteUrl =
	import.meta.env.VITE_SITE_URL ??
	process.env.BETTER_AUTH_URL ??
	"http://localhost:3000";

export const SITE_URL = rawSiteUrl.replace(/\/$/, "");

export function absoluteUrl(path: string): string {
	return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
