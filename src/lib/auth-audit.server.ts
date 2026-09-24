// Runs on the server only. Do NOT import from client-reachable modules at module scope.
//
// Security audit events for better-auth endpoints (called from the
// hooks.after in auth.ts, which sees the endpoint's result, including the
// APIError of a failed attempt).

import { createHmac } from "node:crypto";
import { isAPIError } from "better-auth/api";
import { clientIp, securityLog } from "@/lib/security-log";

// Endpoints worth an audit line: credentials, account recovery, session
// management and anything admin.
const AUDITED_PATHS = new Set([
	"/sign-in/email",
	"/sign-in/username",
	"/sign-up/email",
	"/request-password-reset",
	"/reset-password",
	"/change-password",
	"/update-user",
	"/sign-out",
	"/revoke-session",
	"/revoke-sessions",
	"/revoke-other-sessions",
]);

export function isAuditedPath(path: string): boolean {
	return AUDITED_PATHS.has(path) || path.startsWith("/admin/");
}

// Correlates attempts against one address (credential stuffing, reset
// spam) without writing the address itself into the logs.
export function hashEmail(email: unknown): string | undefined {
	if (typeof email !== "string" || !email) return undefined;
	const key = process.env.BETTER_AUTH_SECRET ?? "";
	return createHmac("sha256", key)
		.update(email.trim().toLowerCase())
		.digest("hex")
		.slice(0, 16);
}

export function auditAuthEndpoint(ctx: {
	path: string;
	body?: unknown;
	headers?: Headers;
	request?: Request;
	context: {
		returned?: unknown;
		newSession?: { user: { id: string } } | null;
		session?: { user: { id: string } } | null;
	};
}) {
	if (!isAuditedPath(ctx.path)) return;

	const body = (ctx.body ?? {}) as Record<string, unknown>;
	// Per the better-auth docs, when the endpoint throws, the after hook
	// still runs and ctx.context.returned holds the APIError.
	const returned = ctx.context.returned;
	const error = isAPIError(returned)
		? {
				statusCode: returned.statusCode,
				code: (returned.body as { code?: string } | undefined)?.code,
			}
		: null;
	const event = ctx.path.startsWith("/admin/")
		? `auth.admin${ctx.path.slice("/admin".length).replaceAll("/", ".")}`
		: `auth${ctx.path.replaceAll("/", ".")}`;

	securityLog(event, error ? "failure" : "success", {
		path: ctx.path,
		status: error?.statusCode ?? 200,
		reason: error?.code,
		userId: ctx.context.newSession?.user.id ?? ctx.context.session?.user.id,
		emailHash: hashEmail(body.email),
		// admin actions: who they targeted
		targetUserId: typeof body.userId === "string" ? body.userId : undefined,
		ip: clientIp(ctx.request?.headers ?? ctx.headers),
	});
}
