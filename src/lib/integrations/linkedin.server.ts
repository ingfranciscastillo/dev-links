import type { FetchResult, LinkedinPayload } from "./types";

// LinkedIn has no public, key-free API for member profiles, and scraping is blocked.
// We validate the handle shape and render a verified profile card on the public page.
export async function fetchLinkedin(input: {
	handle: string;
	config: Record<string, unknown>;
}): Promise<FetchResult[]> {
	const raw = input.handle.trim();
	if (!raw) throw new Error("Empty LinkedIn handle");

	// Accept a full URL or a bare vanity name.
	const match = raw.match(/linkedin\.com\/in\/([^/?#]+)/i);
	const slug = (match ? match[1] : raw.replace(/^@/, "")).replace(/\/+$/, "");
	if (!/^[A-Za-z0-9\-_%À-ÿ.]{3,100}$/.test(slug)) {
		throw new Error("Invalid LinkedIn profile name");
	}

	const headline =
		typeof input.config.headline === "string"
			? input.config.headline.slice(0, 160)
			: "";

	const payload: LinkedinPayload = {
		slug,
		headline,
		url: `https://www.linkedin.com/in/${slug}`,
	};

	return [
		{ kind: "profile", payload: payload as unknown as Record<string, unknown> },
	];
}
