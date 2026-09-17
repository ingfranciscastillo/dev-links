// Redes predefinidas para la sección "Social links" de /profile — el
// usuario solo escribe el username, la URL completa se arma acá. No incluye
// plataformas que ya viven en integrations/ con fetch de datos en vivo
// (GitHub, YouTube, etc), ni LinkedIn (fuera del producto). Mastodon y
// Bluesky son la excepción: viven en integrations/ para el bloque con
// posts, pero el usuario también los quiere acá como link simple.
export type SocialPlatformKey =
	| "x"
	| "instagram"
	| "threads"
	| "behance"
	| "figma"
	| "mastodon"
	| "bluesky";

export type SocialPlatform = {
	key: SocialPlatformKey;
	label: string;
	prefix: string;
	placeholder: string;
	helper?: string;
	buildUrl: (value: string) => string;
	sanitize?: (raw: string) => string;
};

// Mastodon es federado: el "username" real incluye la instancia
// (user@instance.tld) y no hay un dominio fijo para armar la URL.
function sanitizeMastodonHandle(raw: string): string {
	const trimmed = raw.trim();
	const fromUrl = trimmed.match(/^https?:\/\/([^/]+)\/@([^/?#]+)/i);
	if (fromUrl) return `${fromUrl[2]}@${fromUrl[1]}`;
	return trimmed.replace(/^@/, "");
}

function buildMastodonUrl(handle: string): string {
	const [user, instance] = handle.split("@");
	if (!user || !instance) return `https://${handle}`;
	return `https://${instance}/@${user}`;
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
	{
		key: "x",
		label: "X (Twitter)",
		prefix: "x.com/",
		placeholder: "username",
		buildUrl: (u) => `https://x.com/${u}`,
	},
	{
		key: "instagram",
		label: "Instagram",
		prefix: "instagram.com/",
		placeholder: "username",
		buildUrl: (u) => `https://instagram.com/${u}`,
	},
	{
		key: "threads",
		label: "Threads",
		prefix: "threads.net/@",
		placeholder: "username",
		buildUrl: (u) => `https://threads.net/@${u}`,
	},
	{
		key: "behance",
		label: "Behance",
		prefix: "behance.net/",
		placeholder: "username",
		buildUrl: (u) => `https://behance.net/${u}`,
	},
	{
		key: "figma",
		label: "Figma",
		prefix: "figma.com/@",
		placeholder: "username",
		buildUrl: (u) => `https://figma.com/@${u}`,
	},
	{
		key: "mastodon",
		label: "Mastodon",
		prefix: "",
		placeholder: "you@mastodon.social",
		helper: "Full handle, including your instance.",
		buildUrl: buildMastodonUrl,
		sanitize: sanitizeMastodonHandle,
	},
	{
		key: "bluesky",
		label: "Bluesky",
		prefix: "bsky.app/profile/",
		placeholder: "you.bsky.social",
		buildUrl: (u) => `https://bsky.app/profile/${u}`,
	},
];

export const SOCIAL_PLATFORM_KEYS = SOCIAL_PLATFORMS.map(
	(p) => p.key,
) as SocialPlatformKey[];

const SOCIAL_PLATFORM_BY_KEY = new Map(SOCIAL_PLATFORMS.map((p) => [p.key, p]));

export type SocialLinks = Partial<Record<SocialPlatformKey, string>>;

// Usernames son texto libre pegado por el usuario ("@handle", URL completa,
// espacios) — nos quedamos solo con lo que puede ir después del prefijo.
export function sanitizeSocialUsername(raw: string): string {
	return raw
		.trim()
		.replace(/^@/, "")
		.replace(/^https?:\/\/[^/]+\//i, "")
		.replace(/\/+$/, "");
}

export function sanitizeSocialLinks(
	input: Partial<Record<string, string | undefined>> | undefined | null,
): SocialLinks {
	const out: SocialLinks = {};
	for (const key of SOCIAL_PLATFORM_KEYS) {
		const raw = input?.[key];
		if (!raw) continue;
		const sanitize =
			SOCIAL_PLATFORM_BY_KEY.get(key)?.sanitize ?? sanitizeSocialUsername;
		const clean = sanitize(raw);
		if (clean) out[key] = clean;
	}
	return out;
}
