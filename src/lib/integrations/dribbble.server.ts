import type { DribbblePayload, FetchResult } from "./types";

const API_BASE = "https://api.dribbble.com/v2";

// Dribbble's v2 API has no public read endpoint for an arbitrary user's
// shots either — reading someone's own work requires their own OAuth
// token (GET /user/shots, authenticated), same shape as Product Hunt.
type DribbbleUser = {
	id: number;
	name: string | null;
	login: string;
	html_url: string;
	avatar_url: string | null;
	bio: string | null;
	followers_count?: number;
};

type DribbbleShot = {
	id: number;
	title: string;
	description: string | null;
	html_url: string;
	published_at: string | null;
	images: {
		hidpi?: string | null;
		normal?: string | null;
		teaser?: string | null;
	};
	likes_count?: number;
	views_count?: number;
};

async function dribbbleFetch(path: string, accessToken: string) {
	const res = await fetch(`${API_BASE}${path}`, {
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	});
	return res;
}

export async function fetchDribbble(input: {
	handle: string;
	config: Record<string, unknown>;
}): Promise<FetchResult[]> {
	const accessToken = input.config.access_token;
	if (typeof accessToken !== "string" || !accessToken) {
		throw new Error(
			"Dribbble isn't connected — reconnect it from the dashboard.",
		);
	}

	const [userRes, shotsRes] = await Promise.all([
		dribbbleFetch("/user", accessToken),
		dribbbleFetch("/user/shots?per_page=8", accessToken),
	]);

	if (userRes.status === 401 || shotsRes.status === 401) {
		throw new Error(
			"Dribbble session expired — reconnect it from the dashboard.",
		);
	}

	if (!userRes.ok) {
		throw new Error(`Dribbble ${userRes.status}`);
	}

	const user = (await userRes.json()) as DribbbleUser;
	const shots = shotsRes.ok ? ((await shotsRes.json()) as DribbbleShot[]) : [];

	const payload: DribbblePayload = {
		profile: {
			username: user.login,
			name: user.name,
			avatar_url: user.avatar_url,
			bio: user.bio,
			followers: user.followers_count ?? 0,
			url: user.html_url,
		},
		shots: shots.map((s) => ({
			id: s.id,
			title: s.title,
			description: s.description,
			image: s.images.normal ?? s.images.hidpi ?? s.images.teaser ?? null,
			url: s.html_url,
			likes: s.likes_count ?? 0,
			views: s.views_count ?? 0,
			published_at: s.published_at,
		})),
	};

	return [
		{ kind: "profile", payload: payload as unknown as Record<string, unknown> },
	];
}
