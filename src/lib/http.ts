// REST hygiene for server routes (OWASP REST Security).
//
// A route file without a handler for some method falls through to page
// rendering, so e.g. PUT /api/public/hooks/track-click answered 200 with the
// app's HTML. Spreading methodNotAllowed(...) into `handlers` makes every
// other method an explicit 405 with an Allow header.

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const;
type Method = (typeof METHODS)[number];

export function methodNotAllowed(allowed: readonly Method[]) {
	const allow = [...allowed, ...(allowed.includes("GET") ? ["HEAD"] : [])];
	const respond = () =>
		new Response("Method Not Allowed", {
			status: 405,
			headers: { Allow: allow.join(", ") },
		});
	return Object.fromEntries(
		METHODS.filter((m) => !allowed.includes(m)).map((m) => [m, respond]),
	) as Partial<Record<Method, () => Response>>;
}

// JSON-only endpoints reject other body types (415). A text/plain body is a
// "simple" cross-origin request that skips the CORS preflight.
export function requireJson(request: Request): Response | null {
	const type = request.headers.get("content-type") ?? "";
	if (/^application\/json\b/i.test(type)) return null;
	return new Response("Unsupported Media Type", {
		status: 415,
		headers: { Accept: "application/json" },
	});
}
