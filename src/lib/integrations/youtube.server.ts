import type { FetchResult, YoutubePayload } from "./types";

const API_BASE = "https://www.googleapis.com/youtube/v3";

type ChannelsListResponse = {
	items?: Array<{
		snippet?: { title?: string };
		contentDetails?: { relatedPlaylists?: { uploads?: string } };
	}>;
};

type PlaylistItemsResponse = {
	items?: Array<{
		snippet?: {
			title?: string;
			description?: string;
			publishedAt?: string;
			resourceId?: { videoId?: string };
			thumbnails?: Record<string, { url?: string }>;
		};
	}>;
};

async function callYoutubeApi<T>(
	path: string,
	params: Record<string, string>,
	apiKey: string,
): Promise<T> {
	const url = new URL(`${API_BASE}/${path}`);
	for (const [key, value] of Object.entries(params))
		url.searchParams.set(key, value);
	url.searchParams.set("key", apiKey);

	const res = await fetch(url);
	if (!res.ok) {
		const body = await res.text();
		throw new Error(`YouTube API ${path} ${res.status}: ${body.slice(0, 200)}`);
	}
	return res.json() as Promise<T>;
}

export async function fetchYoutube(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const apiKey = process.env.YOUTUBE_API_KEY;
	if (!apiKey) throw new Error("YouTube is not configured on this server");

	const handle = input.handle.trim();
	if (!handle) throw new Error("Empty YouTube channel");

	const isChannelId = /^UC[\w-]{20,}$/.test(handle);
	const channels = await callYoutubeApi<ChannelsListResponse>(
		"channels",
		isChannelId
			? { part: "snippet,contentDetails", id: handle }
			: { part: "snippet,contentDetails", forHandle: handle.replace(/^@/, "") },
		apiKey,
	);

	const channel = channels.items?.[0];
	const uploadsPlaylistId = channel?.contentDetails?.relatedPlaylists?.uploads;
	if (!channel || !uploadsPlaylistId) {
		throw new Error("Could not resolve the YouTube channel");
	}

	const playlistItems = await callYoutubeApi<PlaylistItemsResponse>(
		"playlistItems",
		{ part: "snippet", playlistId: uploadsPlaylistId, maxResults: "8" },
		apiKey,
	);

	const videos: YoutubePayload["videos"] = [];
	for (const item of playlistItems.items ?? []) {
		const snippet = item.snippet;
		const videoId = snippet?.resourceId?.videoId;
		if (!snippet || !videoId) continue;
		videos.push({
			title: snippet.title ?? "",
			url: `https://www.youtube.com/watch?v=${videoId}`,
			thumbnail:
				snippet.thumbnails?.high?.url ??
				snippet.thumbnails?.medium?.url ??
				snippet.thumbnails?.default?.url ??
				null,
			published_at: snippet.publishedAt ?? "",
			description: (snippet.description ?? "").slice(0, 220),
		});
	}

	const payload: YoutubePayload = {
		channel: {
			title: channel.snippet?.title ?? handle,
			url: isChannelId
				? `https://www.youtube.com/channel/${handle}`
				: `https://www.youtube.com/@${handle.replace(/^@/, "")}`,
		},
		videos,
	};

	return [
		{ kind: "videos", payload: payload as unknown as Record<string, unknown> },
	];
}
