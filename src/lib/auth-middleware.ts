import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import { clientIp, securityLog } from "@/lib/security-log";

// Server functions are public RPC endpoints — the _authenticated route guard
// is UX only. Every server function that touches a user's private data
// attaches this middleware and reads `context.userId`, which always comes
// from the session and never from client input. Having the handler depend
// on `context.userId` means a function that forgets the middleware doesn't
// type-check, instead of silently shipping unauthenticated.
export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		// Bypass the 5-minute cookie cache: every server function checks the
		// session row itself, so a revoked session (sign-out elsewhere,
		// password change, ban) can't keep reading or writing data until
		// its cached copy expires. Page navigation still uses the cache.
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({
			headers,
			query: { disableCookieCache: true },
		});
		if (!session) {
			// Also fires when a session expires mid-use, so on its own it's
			// noise; a burst from one IP is the signal worth alerting on.
			securityLog("authz.unauthenticated_server_fn", "blocked", {
				ip: clientIp(headers),
			});
			throw new Error("Unauthorized");
		}
		return next({ context: { userId: session.user.id } });
	},
);
