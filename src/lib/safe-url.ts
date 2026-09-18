const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);

// Defense-in-depth for rows written before the write-side scheme allow-list
// existed. Server validators are the real gate; this stops a stale
// "javascript:"/"data:" value already in the DB from executing as href.
export function sanitizeHref(
	value: string | null | undefined,
): string | undefined {
	if (!value) return undefined;
	try {
		return SAFE_URL_SCHEMES.has(new URL(value).protocol) ? value : undefined;
	} catch {
		return undefined;
	}
}
