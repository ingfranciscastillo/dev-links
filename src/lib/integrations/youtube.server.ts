import type { FetchResult, YoutubePayload } from "./types";

function pick(block: string, tag: string): string {
	const m = block.match(
		new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"),
	);
	return m ? m[1]!.trim() : "";
}

async function resolveChannelId(handle: string): Promise<string> {
	if (/^UC[\w-]{20,}$/.test(handle)) return handle;
	const path = handle.startsWith("@") ? handle : `@${handle}`;
	const res = await fetch(
		`https://www.youtube.com/${encodeURIComponent(path)}`,
		{
			headers: {
				"User-Agent": "Mozilla/5.0 (compatible; DevLinks-Integrations/1.0)",
				Accept: "text/html",
			},
		},
	);
	if (!res.ok) throw new Error(`YouTube ${res.status}`);
	const html = await res.text();
	const m =
		html.match(/"channelId":"(UC[\w-]{20,})"/) ??
		html.match(/channel\/(UC[\w-]{20,})/);
	if (!m) throw new Error("Could not resolve the YouTube channel");
	return m[1]!;
}

export async function fetchYoutube(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = input.handle.trim();
	if (!handle) throw new Error("Empty YouTube channel");
	const channelId = await resolveChannelId(handle);
	const res = await fetch(
		`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
		{
			headers: { Accept: "application/atom+xml, text/xml" },
		},
	);
	if (!res.ok) throw new Error(`YouTube feed ${res.status}`);
	const xml = await res.text();
	const channelTitle = pick(xml.split("<entry>")[0] ?? "", "title") || handle;
	const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];
	const videos: YoutubePayload["videos"] = entries.slice(0, 8).map((e) => {
		const id = pick(e, "yt:videoId");
		const thumb = e.match(/<media:thumbnail[^>]+url="([^"]+)"/i);
		return {
			title: pick(e, "title"),
			url: `https://www.youtube.com/watch?v=${id}`,
			thumbnail: thumb ? thumb[1]! : null,
			published_at: pick(e, "published"),
			description: pick(e, "media:description").slice(0, 220),
		};
	});
	const payload: YoutubePayload = {
		channel: {
			title: channelTitle,
			url: `https://www.youtube.com/channel/${channelId}`,
		},
		videos,
	};
	return [
		{ kind: "videos", payload: payload as unknown as Record<string, unknown> },
	];
}
