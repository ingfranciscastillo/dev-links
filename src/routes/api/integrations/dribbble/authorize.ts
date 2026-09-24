import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth";
import { methodNotAllowed } from "@/lib/http";
import { absoluteUrl } from "@/lib/site";

// Dribbble's API has no public read endpoint for an arbitrary user's
// shots — only GET /user/shots, authenticated as that user, works. Same
// shape as the Product Hunt integration: real per-user OAuth instead of
// a typed handle.
const AUTHORIZE_URL = "https://dribbble.com/oauth/authorize";
export const STATE_COOKIE = "dribbble_oauth_state";

async function startAuthorize(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return Response.redirect(absoluteUrl("/login"), 302);
	}

	const clientId = process.env.DRIBBBLE_CLIENT_ID;
	if (!clientId) {
		return new Response(
			"Dribbble integration is not configured on this server",
			{ status: 500 },
		);
	}

	const state = crypto.randomUUID();

	const params = new URLSearchParams({
		client_id: clientId,
		redirect_uri: absoluteUrl("/api/integrations/dribbble/callback"),
		// "public" (the default) is read-only access to public info — all
		// we need to show shots on a profile, no "upload" scope required.
		scope: "public",
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

export const Route = createFileRoute("/api/integrations/dribbble/authorize")({
	server: {
		handlers: {
			...methodNotAllowed(["GET"]),
			GET: ({ request }) => startAuthorize(request),
		},
	},
});
