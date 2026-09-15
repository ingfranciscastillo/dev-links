import { createFileRoute } from "@tanstack/react-router";
import { eq } from "drizzle-orm";
import { db } from "@/db/index";
import { integrationAccounts, profiles } from "@/db/schema";
import { auth } from "@/lib/auth";
import { limitsFor } from "@/lib/plan-limits";
import { absoluteUrl } from "@/lib/site";
import { STATE_COOKIE } from "./authorize";

const TOKEN_URL = "https://api.pinterest.com/v5/oauth/token";
const USER_URL = "https://api.pinterest.com/v5/user_account";
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
	url.searchParams.set("pinterest", status);
	if (detail) url.searchParams.set("pinterest_error", detail.slice(0, 200));

	return new Response(null, {
		status: 302,
		headers: {
			Location: url.toString(),
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

	const clientId = process.env.PINTEREST_CLIENT_ID;
	const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		return redirectToIntegrations(
			"error",
			"Pinterest is not configured on this server",
		);
	}

	const tokenBody = new URLSearchParams({
		grant_type: "authorization_code",
		code,
		redirect_uri: absoluteUrl("/api/integrations/pinterest/callback"),
	});

	// Pinterest, unlike Product Hunt/Dribbble, requires client credentials
	// as an HTTP Basic Authorization header rather than in the form body.
	const basicAuth = btoa(`${clientId}:${clientSecret}`);

	const tokenRes = await fetch(TOKEN_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
			Authorization: `Basic ${basicAuth}`,
		},
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

	const userRes = await fetch(USER_URL, {
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${tokenJson.access_token}`,
		},
	});
	const userJson = (await userRes.json()) as { username?: string };

	if (!userRes.ok || !userJson.username) {
		return redirectToIntegrations(
			"error",
			"Couldn't read your Pinterest profile",
		);
	}

	// Same free-plan cap upsertIntegrationAccount enforces — this route
	// writes to integration_accounts directly (OAuth, not the handle
	// form), so it has to check it itself instead of inheriting it.
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
		const alreadyConnected = existing.some((r) => r.provider === "pinterest");
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

	await db
		.insert(integrationAccounts)
		.values({
			userId: session.user.id,
			provider: "pinterest",
			handle: userJson.username,
			config,
			lastError: null,
		})
		.onConflictDoUpdate({
			target: [integrationAccounts.userId, integrationAccounts.provider],
			set: {
				handle: userJson.username,
				config,
				lastError: null,
				updatedAt: new Date(),
			},
		});

	return redirectToIntegrations("connected");
}

export const Route = createFileRoute("/api/integrations/pinterest/callback")({
	server: {
		handlers: {
			GET: ({ request }) => handleCallback(request),
		},
	},
});
