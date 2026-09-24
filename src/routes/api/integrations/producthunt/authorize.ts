import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { methodNotAllowed } from "@/lib/http";
import { absoluteUrl } from "@/lib/site";

// Product Hunt has no API to read another user's launches — the only way
// to show someone's own posts is viewer.user.madePosts, authenticated as
// them. So this provider connects via a real per-user OAuth authorization
// instead of the "type your username" form every other integration uses.
const AUTHORIZE_URL = "https://api.producthunt.com/v2/oauth/authorize";
export const STATE_COOKIE = "ph_oauth_state";

async function startAuthorize(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return Response.redirect(absoluteUrl("/login"), 302);
	}

	const clientId = process.env.PRODUCTHUNT_CLIENT_ID;
	if (!clientId) {
		return new Response(
			"Product Hunt integration is not configured on this server",
			{ status: 500 },
		);
	}

	// Random per-attempt state, checked against the same cookie in the
	// callback — mitigates an attacker linking their own PH account to a
	// signed-in victim's DevLinks account (OAuth login CSRF).
	const state = crypto.randomUUID();

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: absoluteUrl("/api/integrations/producthunt/callback"),
		response_type: "code",
		// "private" is required for viewer.user's own connections
		// (madePosts) to resolve — "public" alone returns them empty even
		// for the authenticated user, verified live against the real API.
		scope: "public private",
		state,
	});

	return new Response(null, {
		status: 302,
		headers: {
			Location: `${AUTHORIZE_URL}?${params.toString()}`,
			"Set-Cookie": `${STATE_COOKIE}=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`,
		},
	});
}

export const Route = createFileRoute("/api/integrations/producthunt/authorize")(
	{
		server: {
			handlers: {
				...methodNotAllowed(["GET"]),
				GET: ({ request }) => startAuthorize(request),
			},
		},
	},
);
