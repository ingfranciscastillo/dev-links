import type { BlueskyPayload, FetchResult } from "./types";

const API = "https://public.api.bsky.app/xrpc";

export async function fetchBluesky(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = input.handle.trim().replace(/^@/, "");
	if (!handle) throw new Error("Empty Bluesky handle");

	const profRes = await fetch(
		`${API}/app.bsky.actor.getProfile?actor=${encodeURIComponent(handle)}`,
		{
			headers: {
				Accept: "application/json",
				"User-Agent": "DevLinks-Integrations/1.0",
			},
		},
	);
	if (!profRes.ok) throw new Error(`Bluesky ${profRes.status}`);
	const prof = (await profRes.json()) as Record<string, unknown>;

	const feedRes = await fetch(
		`${API}/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=10&filter=posts_no_replies`,
		{
			headers: {
				Accept: "application/json",
				"User-Agent": "DevLinks-Integrations/1.0",
			},
		},
	);
	const feed = feedRes.ok
		? ((
				(await feedRes.json()) as {
					feed?: Array<{ post: Record<string, unknown> }>;
				}
			).feed ?? [])
		: [];

	const posts: BlueskyPayload["posts"] = feed.slice(0, 10).map(({ post }) => {
		const record = (post.record as { text?: string; createdAt?: string }) ?? {};
		const uri = (post.uri as string) ?? "";
		const rkey = uri.split("/").pop() ?? "";
		return {
			text: record.text ?? "",
			url: `https://bsky.app/profile/${handle}/post/${rkey}`,
			created_at: record.createdAt ?? "",
			likes: (post.likeCount as number) ?? 0,
			reposts: (post.repostCount as number) ?? 0,
			replies: (post.replyCount as number) ?? 0,
		};
	});

	const payload: BlueskyPayload = {
		profile: {
			handle: (prof.handle as string) ?? handle,
			display_name:
				(prof.displayName as string) ?? (prof.handle as string) ?? handle,
			avatar: (prof.avatar as string | undefined) ?? null,
			followers: (prof.followersCount as number) ?? 0,
			follows: (prof.followsCount as number) ?? 0,
			posts: (prof.postsCount as number) ?? 0,
			url: `https://bsky.app/profile/${(prof.handle as string) ?? handle}`,
		},
		posts,
	};
	return [
		{ kind: "feed", payload: payload as unknown as Record<string, unknown> },
	];
}
