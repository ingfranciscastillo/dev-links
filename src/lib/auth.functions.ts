import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

type FullSession = typeof auth.$Infer.Session;

// Both functions below are RPC endpoints the browser can call directly, so
// whatever they return lands in client JS. The raw getSession() result
// includes session.token — the same bearer value the HttpOnly cookie exists
// to keep away from scripts — so only the fields callers actually read
// leave the server.
function toClientSession(session: FullSession) {
	return {
		user: session.user,
		session: {
			id: session.session.id,
			expiresAt: session.session.expiresAt,
		},
	};
}

export const getSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });

		return session ? toClientSession(session) : null;
	},
);

export const ensureSession = createServerFn({ method: "GET" }).handler(
	async () => {
		const headers = getRequestHeaders();
		const session = await auth.api.getSession({ headers });
		if (!session) {
			throw new Error("Unauthorized");
		}
		return toClientSession(session);
	},
);
