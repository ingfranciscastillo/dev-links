import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

// Server functions are public RPC endpoints — the _authenticated route guard
// is UX only. Every server function that touches a user's private data
// attaches this middleware and reads `context.userId`, which always comes
// from the session and never from client input. Having the handler depend
// on `context.userId` means a function that forgets the middleware doesn't
// type-check, instead of silently shipping unauthenticated.
export const authMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const session = await auth.api.getSession({
			headers: getRequestHeaders(),
		});
		if (!session) {
			throw new Error("Unauthorized");
		}
		return next({ context: { userId: session.user.id } });
	},
);
