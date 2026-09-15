import type { FetchResult, PinterestPayload } from "./types";

const API_BASE = "https://api.pinterest.com/v5";

// Same shape as Product Hunt/Dribbble: Pinterest has no public read
// endpoint for an arbitrary user's pins either — GET /pins defaults to
// "the token user_account", so this connects via OAuth per user.
type PinterestUser = {
	username: string;
	website_url: string | null;
	profile_image: string | null;
	follower_count?: number;
	pin_count?: number;
};

type PinterestImageSize = { url: string; width: number; height: number };

type PinterestPin = {
	id: string;
	title: string | null;
	description: string | null;
	link: string | null;
	created_at: string | null;
	media?: {
		images?: Record<string, PinterestImageSize>;
	};
};

async function pinterestFetch(path: string, accessToken: string) {
	return fetch(`${API_BASE}${path}`, {
		headers: {
			Accept: "application/json",
			Authorization: `Bearer ${accessToken}`,
		},
	});
}

function bestImage(pin: PinterestPin): string | null {
	const images = pin.media?.images;
	if (!images) return null;
	return (
		images["400x300"]?.url ??
		images.originals?.url ??
		Object.values(images)[0]?.url ??
		null
	);
}

export async function fetchPinterest(input: {
	handle: string;
	config: Record<string, unknown>;
}): Promise<FetchResult[]> {
	const accessToken = input.config.access_token;
	if (typeof accessToken !== "string" || !accessToken) {
		throw new Error(
			"Pinterest isn't connected — reconnect it from the dashboard.",
		);
	}

	const [userRes, pinsRes] = await Promise.all([
		pinterestFetch("/user_account", accessToken),
		pinterestFetch("/pins?page_size=8", accessToken),
	]);

	if (userRes.status === 401 || pinsRes.status === 401) {
		throw new Error(
			"Pinterest session expired — reconnect it from the dashboard.",
		);
	}

	if (!userRes.ok) {
		throw new Error(`Pinterest ${userRes.status}`);
	}

	const user = (await userRes.json()) as PinterestUser;
	const pinsJson = pinsRes.ok
		? ((await pinsRes.json()) as { items?: PinterestPin[] })
		: { items: [] };
	const pins = pinsJson.items ?? [];

	const payload: PinterestPayload = {
		profile: {
			username: user.username,
			website_url: user.website_url,
			avatar_url: user.profile_image,
			followers: user.follower_count ?? 0,
			pin_count: user.pin_count ?? 0,
			url: `https://www.pinterest.com/${user.username}/`,
		},
		pins: pins.map((p) => ({
			id: p.id,
			title: p.title,
			description: p.description,
			image: bestImage(p),
			url: p.link || `https://www.pinterest.com/pin/${p.id}/`,
			created_at: p.created_at,
		})),
	};

	return [
		{ kind: "profile", payload: payload as unknown as Record<string, unknown> },
	];
}
