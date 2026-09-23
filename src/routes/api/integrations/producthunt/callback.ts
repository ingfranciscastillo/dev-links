import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db/index";
import { integrationAccounts, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { encryptConfigSecrets } from "@/lib/integrations/secrets.server";
import { limitsFor } from "@/lib/plan-limits";
import { absoluteUrl } from "@/lib/site";
import { STATE_COOKIE } from "./authorize";

const TOKEN_URL = "https://api.producthunt.com/v2/oauth/token";
const GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql";
const REDIRECT_TARGET = "/dashboard/integrations";

function readCookie(request: Request, name: string): string | null {
	const header = request.headers.get("cookie");
	if (!header) return null;
	for (const part of header.split(";")) {
		const separator = part.indexOf("=");
		if (separator === -1) continue;
		if (part.slice(0, separator).trim() === name) {
			return decodeURIComponent(part.slice(separator + 1).trim());
		}
	}
	return null;
}

function redirectToIntegrations(
	status: "connected" | "error",
	detail?: string,
) {
	const url = new URL(absoluteUrl(REDIRECT_TARGET));
	url.searchParams.set("producthunt", status);
	if (detail) url.searchParams.set("producthunt_error", detail.slice(0, 200));

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString(),
			// Clear the one-time state cookie regardless of outcome.
			"Set-Cookie": `${STATE_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`,
		},
	});
}

async function handleCallback(request: Request) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) {
		return Response.redirect(absoluteUrl("/login"), 302);
	}

	const url = new URL(request.url);
	const oauthError = url.searchParams.get("error");
	if (oauthError) {
		return redirectToIntegrations("error", oauthError);
	}

	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	const expectedState = readCookie(request, STATE_COOKIE);

	if (!code || !state || !expectedState || state !== expectedState) {
		return redirectToIntegrations("error", "Invalid OAuth state");
	}

	const clientId = process.env.PRODUCTHUNT_CLIENT_ID;
	const clientSecret = process.env.PRODUCTHUNT_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		return redirectToIntegrations(
			"error",
			"Product Hunt is not configured on this server",
		);
	}

	const tokenBody = new URLSearchParams({
		grant_type: "authorization_code",
		client_id: clientId,
		client_secret: clientSecret,
		code,
		redirect_uri: absoluteUrl("/api/integrations/producthunt/callback"),
	});

	const tokenRes = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: tokenBody.toString(),
	});

	if (!tokenRes.ok) {
		return redirectToIntegrations(
			"error",
			`Token exchange failed (${tokenRes.status})`,
		);
	}

	const tokenJson = (await tokenRes.json()) as {
		access_token?: string;
		refresh_token?: string;
	};

	if (!tokenJson.access_token) {
		return redirectToIntegrations("error", "No access token returned");
	}

	const viewerRes = await fetch(GRAPHQL_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${tokenJson.access_token}`,
		},
		body: JSON.stringify({ query: "query { viewer { user { username } } }" }),
	});

	const viewerJson = (await viewerRes.json()) as {
		data?: { viewer: { user: { username: string } } | null };
	};
	const username = viewerJson.data?.viewer?.user?.username;

	if (!username) {
		return redirectToIntegrations(
			"error",
			"Couldn't read your Product Hunt profile",
		);
	}

	// Same free-plan cap upsertIntegrationAccount enforces — this route
	// writes to integration_accounts directly (OAuth, not the handle form),
	// so it has to check it itself instead of inheriting it for free.
	const [planRow] = await db
		.select({ plan: profiles.plan })
		.from(profiles)
		.where(eq(profiles.id, session.user.id))
		.limit(1);
	const limits = limitsFor(planRow?.plan);

	if (Number.isFinite(limits.integrations)) {
		const existing = await db
			.select({ provider: integrationAccounts.provider })
			.from(integrationAccounts)
			.where(eq(integrationAccounts.userId, session.user.id));
		const alreadyConnected = existing.some((r) => r.provider === "producthunt");
		if (!alreadyConnected && existing.length >= limits.integrations) {
			return redirectToIntegrations(
				"error",
				`Free plan is limited to ${limits.integrations} connected integrations. Upgrade to Pro for unlimited.`,
			);
		}
	}

	const config = {
		access_token: tokenJson.access_token,
		refresh_token: tokenJson.refresh_token ?? null,
	};

	// Tokens are encrypted at rest; runProviderFetch decrypts them.
	const storedConfig = encryptConfigSecrets(config);

	await db
		.insert(integrationAccounts)
		.values({
			userId: session.user.id,
			provider: "producthunt",
			handle: username,
			config: storedConfig,
			lastError: null,
		})
		.onConflictDoUpdate({
			target: [integrationAccounts.userId, integrationAccounts.provider],
			set: {
				handle: username,
				config: storedConfig,
				lastError: null,
				updatedAt: new Date(),
			},
		});

	return redirectToIntegrations("connected");
}

export const Route = createFileRoute("/api/integrations/producthunt/callback")({
	server: {
		handlers: {
			GET: ({ request }) => handleCallback(request),
		},
	},
});
