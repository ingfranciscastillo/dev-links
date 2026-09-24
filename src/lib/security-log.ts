// Structured security event log (OWASP Logging Cheat Sheet): one JSON line
// per event — when / where / who / what / outcome — so failed logins, CSRF
// blocks, admin actions etc. can be searched and alerted on in Vercel logs.
//
// JSON.stringify escapes CR/LF, so user-controlled values can't forge extra
// log lines. Secrets never belong here: keys that look like credentials are
// dropped, and callers pass a hashed email (see hashEmail in auth.ts), never
// the address itself. No Node-only imports: src/start.ts uses this too.

export type SecurityOutcome = "success" | "failure" | "blocked";

const SECRET_KEY = /token|password|secret|cookie|authorization|code/i;
const MAX_STRING = 300;

function clean(value: unknown): unknown {
	if (typeof value === "string") return value.slice(0, MAX_STRING);
	if (value === null || typeof value !== "object") return value;
	if (Array.isArray(value)) return value.slice(0, 20).map(clean);
	const out: Record<string, unknown> = {};
	for (const [key, v] of Object.entries(value)) {
		if (SECRET_KEY.test(key)) continue;
		if (v !== undefined) out[key] = clean(v);
	}
	return out;
}

export function securityLog(
	event: string,
	outcome: SecurityOutcome,
	fields: Record<string, unknown> = {},
) {
	const entry = {
		ts: new Date().toISOString(),
		type: "security",
		event,
		outcome,
		...(clean(fields) as Record<string, unknown>),
	};
	const line = JSON.stringify(entry);
	if (outcome === "success") console.info(line);
	else console.warn(line);
	return entry;
}

// First address in X-Forwarded-For (set by Vercel), else X-Real-IP.
export function clientIp(headers: Headers | undefined | null): string | null {
	const forwarded = headers?.get("x-forwarded-for")?.split(",")[0]?.trim();
	return forwarded || headers?.get("x-real-ip") || null;
}
