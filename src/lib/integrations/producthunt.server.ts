import type { FetchResult, ProductHuntPayload } from "./types";

const TOKEN_URL = "https://api.producthunt.com/v2/oauth/token";
const GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql";

// Token is app-level (client_credentials), not per-user — one token serves
// every DevLinks user's Product Hunt fetches, so it's worth caching in
// module scope across requests within the same server process.
let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAppToken(): Promise<string> {
	const clientId = process.env.PRODUCTHUNT_CLIENT_ID;
	const clientSecret = process.env.PRODUCTHUNT_CLIENT_SECRET;
	if (!clientId || !clientSecret) {
		throw new Error(
			"Product Hunt integration is not configured on this server",
		);
	}

	if (cachedToken && cachedToken.expiresAt > Date.now()) {
		return cachedToken.token;
	}

	const res = await fetch(TOKEN_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			client_id: clientId,
			client_secret: clientSecret,
			grant_type: "client_credentials",
		}),
	});

	if (!res.ok) {
		throw new Error(
			`Product Hunt token ${res.status}: ${await res.text().catch(() => res.statusText)}`,
		);
	}

	const json = (await res.json()) as {
		access_token?: string;
		expires_in?: number;
	};
	if (!json.access_token) {
		throw new Error("Product Hunt: token response had no access_token");
	}

	cachedToken = {
		token: json.access_token,
		expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 - 60_000,
	};
	return cachedToken.token;
}

const QUERY = `
	query UserProfile($username: String!) {
		user(username: $username) {
			name
			username
			headline
			profileImage
			url
			followersCount
			madePosts(first: 6) {
				edges {
					node {
						id
						name
						tagline
						url
						votesCount
						commentsCount
						createdAt
						thumbnail { url }
					}
				}
			}
		}
	}
`;

type PHPost = {
	id: string;
	name: string;
	tagline: string;
	url: string;
	votesCount?: number;
	commentsCount?: number;
	createdAt: string;
	thumbnail: { url: string } | null;
};

type PHUser = {
	name: string;
	username: string;
	headline: string | null;
	profileImage: string | null;
	url: string;
	followersCount?: number;
	madePosts: { edges: Array<{ node: PHPost }> };
};

export async function fetchProductHunt(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = input.handle.trim().replace(/^@/, "");
	if (!handle) throw new Error("Empty Product Hunt username");

	const token = await getAppToken();

	const res = await fetch(GRAPHQL_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify({ query: QUERY, variables: { username: handle } }),
	});

	if (!res.ok) {
		throw new Error(
			`Product Hunt ${res.status}: ${await res.text().catch(() => res.statusText)}`,
		);
	}

	const json = (await res.json()) as {
		data?: { user: PHUser | null };
		errors?: Array<{ message: string }>;
	};

	const firstError = json.errors?.[0];
	if (firstError) {
		throw new Error(`Product Hunt: ${firstError.message}`);
	}

	const user = json.data?.user;
	if (!user) throw new Error("Product Hunt user not found");

	const payload: ProductHuntPayload = {
		profile: {
			username: user.username,
			name: user.name,
			headline: user.headline,
			avatar_url: user.profileImage,
			followers: user.followersCount ?? 0,
			url: user.url,
		},
		posts: user.madePosts.edges.map(({ node }) => ({
			id: node.id,
			name: node.name,
			tagline: node.tagline,
			url: node.url,
			votes: node.votesCount ?? 0,
			comments: node.commentsCount ?? 0,
			thumbnail: node.thumbnail?.url ?? null,
			created_at: node.createdAt,
		})),
	};

	return [
		{ kind: "profile", payload: payload as unknown as Record<string, unknown> },
	];
}
