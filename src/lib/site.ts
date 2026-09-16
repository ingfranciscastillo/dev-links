const rawSiteUrl =
	import.meta.env.VITE_SITE_URL ??
	process.env.BETTER_AUTH_URL ??
	"http://localhost:3000";

export const SITE_URL = rawSiteUrl.replace(/\/$/, "");

export function absoluteUrl(path: string): string {
	// In the browser, use the real origin instead of SITE_URL — process.env
	// isn't populated client-side (only import.meta.env.VITE_* is inlined),
	// so any client-rendered absoluteUrl() call (e.g. the GitHub Grader's
	// share link) silently fell back all the way to localhost:3000, in
	// production too, whenever VITE_SITE_URL wasn't set. window.location.origin
	// is always correct and needs no env var to stay that way.
	const origin =
		typeof window !== "undefined" ? window.location.origin : SITE_URL;
	return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
