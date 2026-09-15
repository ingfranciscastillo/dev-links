import type { FetchResult, ProductHuntPayload } from "./types";

const GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql";

// User(username: ...).madePosts is empty for every account when queried
// with any app-level or third-party token — verified live against the
// real API, including for Product Hunt's own founder. Only
// viewer.user.madePosts (yourself, authenticated as yourself) resolves,
// which is why this integration connects via OAuth (see
// routes/api/integrations/producthunt/) instead of a typed handle.
const QUERY = `
	query Viewer {
		viewer {
			user {
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
	config: Record<string, unknown>;
}): Promise<FetchResult[]> {
	const accessToken = input.config.access_token;
	if (typeof accessToken !== "string" || !accessToken) {
		throw new Error(
			"Product Hunt isn't connected — reconnect it from the dashboard.",
		);
	}

	const res = await fetch(GRAPHQL_URL, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
		body: JSON.stringify({ query: QUERY }),
	});

	if (res.status === 401) {
		throw new Error(
			"Product Hunt session expired — reconnect it from the dashboard.",
		);
	}

	if (!res.ok) {
		throw new Error(
			`Product Hunt ${res.status}: ${await res.text().catch(() => res.statusText)}`,
		);
	}

	const json = (await res.json()) as {
		data?: { viewer: { user: PHUser } | null };
		errors?: Array<{ message: string }>;
	};

	const firstError = json.errors?.[0];
	if (firstError) {
		throw new Error(`Product Hunt: ${firstError.message}`);
	}

	const user = json.data?.viewer?.user;
	if (!user) {
		throw new Error(
			"Product Hunt session expired — reconnect it from the dashboard.",
		);
	}

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
