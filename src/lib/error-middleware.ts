import { createMiddleware } from "@tanstack/react-start";
import { securityLog } from "@/lib/security-log";

// TanStack Start sends a thrown error's `message` to the browser. For our own
// errors that's intended ("Free plan is limited to…", "Unauthorized"), but a
// database failure carries Drizzle's message — "Failed query: <SQL>\nparams:
// <values>" — and programming errors carry internals. Those are logged in
// full server-side and replaced with a generic message (OWASP REST: no
// internal details in error responses). No Node/DB imports: src/start.ts,
// which is isomorphic, imports this.

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

const INTERNAL_ERROR_NAMES = new Set([
	"DrizzleQueryError",
	"NeonDbError",
	"PostgresError",
	"TypeError",
	"ReferenceError",
	"SyntaxError",
	"RangeError",
]);

export function isInternalError(error: unknown): boolean {
	if (!(error instanceof Error)) return false;
	if (INTERNAL_ERROR_NAMES.has(error.name)) return true;
	if (error.message.startsWith("Failed query:")) return true;
	// Postgres errors carry a 5-char SQLSTATE code (e.g. "23505").
	const code = (error as { code?: unknown }).code;
	return typeof code === "string" && /^[0-9A-Z]{5}$/.test(code);
}

function sanitize(error: unknown): unknown {
	if (!isInternalError(error)) return error;
	const e = error as Error;
	securityLog("server_fn.internal_error", "failure", {
		name: e.name,
		// The full message may include SQL/params: server log only.
		detail: e.message,
	});
	return new Error(GENERIC_ERROR_MESSAGE);
}

export const errorSanitizerMiddleware = createMiddleware({
	type: "function",
}).server(async ({ next }) => {
	try {
		const result = await next();
		const withError = result as { error?: unknown };
		if (withError?.error !== undefined) {
			withError.error = sanitize(withError.error);
		}
		return result;
	} catch (error) {
		throw sanitize(error);
	}
});
