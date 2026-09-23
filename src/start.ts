import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

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
});

export const startInstance = createStart(() => ({
	requestMiddleware: [csrfMiddleware],
}));
