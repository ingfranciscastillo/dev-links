import { safeGet } from "@/lib/safe-fetch.server";
import type { FetchResult, MastodonPayload } from "./types";

function stripTags(s: string): string {
	return s
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

// The instance host comes from the user's handle, so every request to it goes
// through safeGet (SSRF protection: public addresses only, checked at connect
// time; no redirects; timeout and size cap). Up front we additionally require
// a plain DNS name — Mastodon instances are never bare IPs or ports.
const INSTANCE_HOST_RE =
	/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

function parseHandle(raw: string): { user: string; host: string } {
	const handle = raw.trim().replace(/^@/, "");
	const parts = handle.split("@");
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		throw new Error("Use the full handle: user@instance.social");
	}
	if (!INSTANCE_HOST_RE.test(parts[1])) {
		throw new Error("This Mastodon instance host is not allowed");
	}
	return { user: parts[0], host: parts[1].toLowerCase() };
}

// Everything in the payload comes from the (user-chosen) instance and is
// rendered as href/src on the public profile — keep only https URLs.
function httpsUrl(value: unknown): string | null {
	if (typeof value !== "string") return null;
	try {
		return new URL(value).protocol === "https:" ? value : null;
	} catch {
		return null;
	}
}

const HEADERS = {
	Accept: "application/json",
	"User-Agent": "DevLinks-Integrations/1.0",
};

export async function fetchMastodon(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const { user, host } = parseHandle(input.handle);
	const base = `https://${host}`;
	const accRes = await safeGet(
		`${base}/api/v1/accounts/lookup?acct=${encodeURIComponent(user)}`,
		{ headers: HEADERS },
	);
	if (!accRes.ok) throw new Error(`Mastodon ${accRes.status}`);
	const acc = JSON.parse(accRes.text) as Record<string, unknown>;
	const id = acc.id as string;

	const stRes = await safeGet(
		`${base}/api/v1/accounts/${encodeURIComponent(id)}/statuses?limit=10&exclude_replies=true&exclude_reblogs=true`,
		{ headers: HEADERS },
	);
	const statuses = stRes.ok
		? (JSON.parse(stRes.text) as Array<Record<string, unknown>>)
		: [];

	const payload: MastodonPayload = {
		profile: {
			acct: `@${user}@${host}`,
			display_name: (acc.display_name as string) || user,
			avatar: httpsUrl(acc.avatar),
			followers: (acc.followers_count as number) ?? 0,
			following: (acc.following_count as number) ?? 0,
			statuses: (acc.statuses_count as number) ?? 0,
			url: httpsUrl(acc.url) ?? `${base}/@${user}`,
		},
		posts: statuses.slice(0, 10).map((s) => ({
			text: stripTags((s.content as string) ?? "").slice(0, 280),
			url: httpsUrl(s.url) ?? "",
			created_at: (s.created_at as string) ?? "",
			favourites: (s.favourites_count as number) ?? 0,
			reblogs: (s.reblogs_count as number) ?? 0,
		})),
	};
	return [
		{ kind: "feed", payload: payload as unknown as Record<string, unknown> },
	];
}
