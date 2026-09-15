import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { absoluteUrl } from "@/lib/site";

// Same reasoning as Product Hunt/Dribbble: Pinterest's API has no public
// read endpoint for a third party's pins — GET /pins only ever returns
// "the token user_account"'s own pins, so this connects via real
// per-user OAuth instead of a typed handle.
const AUTHORIZE_URL = "https://www.pinterest.com/oauth/";
export const STATE_COOKIE = "pinterest_oauth_state";

async function startAuthorize(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return Response.redirect(absoluteUrl("/login"), 302);
	}

	const clientId = process.env.PINTEREST_CLIENT_ID;
	if (!clientId) {
		return new Response(
			"Pinterest integration is not configured on this server",
			{ status: 500 },
		);
	}

	const state = crypto.randomUUID();

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: absoluteUrl("/api/integrations/pinterest/callback"),
		response_type: "code",
		// Pinterest scopes are comma-separated, not space-separated.
		scope: "user_accounts:read,pins:read,boards:read",
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

export const Route = createFileRoute("/api/integrations/pinterest/authorize")({
	server: {
		handlers: {
			GET: ({ request }) => startAuthorize(request),
		},
	},
});
