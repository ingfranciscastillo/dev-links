import type { FetchResult, MastodonPayload } from "./types";

function stripTags(s: string): string {
	return s
		.replace(/<[^>]+>/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

// Blocks SSRF into the server's internal network via an attacker-supplied
// instance host: literal loopback/private/link-local/reserved IPs (IPv4 and
// IPv6), plus "localhost". Does not resolve DNS, so a rebinding attack via a
// public hostname that later resolves to an internal IP is out of scope here.
function isDisallowedHost(host: string): boolean {
	const h = host.toLowerCase();
	if (h === "localhost" || h.endsWith(".localhost")) return true;

	const bracketless = h.startsWith("[") && h.endsWith("]") ? h.slice(1, -1) : h;

	const ipv4Match = bracketless.match(
		/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/,
	);
	if (ipv4Match) {
		const [a, b] = [Number(ipv4Match[1]), Number(ipv4Match[2])];
		if (a === 127) return true; // loopback
		if (a === 10) return true; // private
		if (a === 172 && b >= 16 && b <= 31) return true; // private
		if (a === 192 && b === 168) return true; // private
		if (a === 169 && b === 254) return true; // link-local / cloud metadata
		if (a === 0) return true; // "this network"
		return false;
	}

	if (bracketless.includes(":")) {
		// IPv6: treat anything other than a clearly-global address as unsafe.
		if (bracketless === "::1") return true; // loopback
		if (/^fe[89ab][0-9a-f]:/i.test(bracketless)) return true; // link-local
		if (/^f[cd][0-9a-f]{2}:/i.test(bracketless)) return true; // unique local
		if (bracketless === "::" || /^::ffff:/i.test(bracketless)) return true;
		return false;
	}

	return false;
}

function parseHandle(raw: string): { user: string; host: string } {
	const handle = raw.trim().replace(/^@/, "");
	const parts = handle.split("@");
	if (parts.length !== 2 || !parts[0] || !parts[1]) {
		throw new Error("Use the full handle: user@instance.social");
	}
	if (isDisallowedHost(parts[1])) {
		throw new Error("This Mastodon instance host is not allowed");
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
