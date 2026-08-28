import type { FetchResult, MastodonPayload } from "./types";

function stripTags(s: string): string {
	return s
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function parseHandle(raw: string): { user: string; host: string } {
	const handle = raw.trim().replace(/^@/, "");
	const parts = handle.split("@");
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		throw new Error("Use the full handle: user@instance.social");
	}
	return { user: parts[0], host: parts[1] };
}

export async function fetchMastodon(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const { user, host } = parseHandle(input.handle);
	const base = `https://${host}`;
	const accRes = await fetch(
		`${base}/api/v1/accounts/lookup?acct=${encodeURIComponent(user)}`,
		{
			headers: {
				Accept: "application/json",
				"User-Agent": "DevLinks-Integrations/1.0",
			},
		},
	);
	if (!accRes.ok) throw new Error(`Mastodon ${accRes.status}`);
	const acc = (await accRes.json()) as Record<string, unknown>;
	const id = acc.id as string;

	const stRes = await fetch(
		`${base}/api/v1/accounts/${encodeURIComponent(id)}/statuses?limit=10&exclude_replies=true&exclude_reblogs=true`,
		{
			headers: {
				Accept: "application/json",
				"User-Agent": "DevLinks-Integrations/1.0",
			},
		},
	);
	const statuses = stRes.ok
		? ((await stRes.json()) as Array<Record<string, unknown>>)
		: [];

	const payload: MastodonPayload = {
		profile: {
			acct: `@${user}@${host}`,
			display_name: (acc.display_name as string) || user,
			avatar: (acc.avatar as string | undefined) ?? null,
			followers: (acc.followers_count as number) ?? 0,
			following: (acc.following_count as number) ?? 0,
			statuses: (acc.statuses_count as number) ?? 0,
			url: (acc.url as string) ?? `${base}/@${user}`,
		},
		posts: statuses.slice(0, 10).map((s) => ({
			text: stripTags((s.content as string) ?? "").slice(0, 280),
			url: (s.url as string) ?? "",
			created_at: (s.created_at as string) ?? "",
			favourites: (s.favourites_count as number) ?? 0,
			reblogs: (s.reblogs_count as number) ?? 0,
		})),
	};
	return [
		{ kind: "feed", payload: payload as unknown as Record<string, unknown> },
	];
}
