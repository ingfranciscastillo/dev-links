import { createCsrfMiddleware, createStart } from "@tanstack/react-start";
import { errorSanitizerMiddleware } from "@/lib/error-middleware";
import { clientIp, securityLog } from "@/lib/security-log";

// CSRF defense for server functions, TanStack Start's built-in middleware
// (OWASP: Fetch Metadata, falling back to Origin, then Referer). The session
// cookie's SameSite=Lax already blocks most cross-site POSTs; this also
// covers what Lax doesn't (sibling subdomains, browsers without SameSite).
//
// Scoped to server functions only: their calls are always same-origin
// fetches from the app itself. Pages and server routes must stay reachable
// cross-site (links to a public profile, OAuth callbacks, Dodo webhooks,
// the Vercel cron); better-auth checks the origin of /api/auth itself.
export const csrfMiddleware = createCsrfMiddleware({
	filter: (ctx) => ctx.handlerType === "serverFn",
	// Same 403 as the default, plus an audit line for the blocked attempt.
	failureResponse: (ctx) => {
		const headers = ctx.request.headers;
		securityLog("csrf.blocked", "blocked", {
			path: new URL(ctx.request.url).pathname,
			method: ctx.request.method,
			secFetchSite: headers.get("sec-fetch-site"),
			origin: headers.get("origin"),
			referer: headers.get("referer"),
			ip: clientIp(headers),
		});
		return new Response("Forbidden", { status: 403 });
	},
});

export const startInstance = createStart(() => ({
	requestMiddleware: [csrfMiddleware],
	// First in the chain so it also wraps authMiddleware and every handler.
	functionMiddleware: [errorSanitizerMiddleware],
}));
