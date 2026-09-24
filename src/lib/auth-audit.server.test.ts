import { APIError } from "better-auth/api";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { auditAuthEndpoint, hashEmail } from "./auth-audit.server";

beforeAll(() => {
	process.env.BETTER_AUTH_SECRET = "test-secret-for-audit-hashing-0123";
});
afterEach(() => vi.restoreAllMocks());

const request = (ip: string) =>
	new Request("https://devlinks.test/api/auth/sign-in/email", {
		headers: { "x-forwarded-for": ip },
	});

describe("auditAuthEndpoint", () => {
	it("logs a failed sign-in with reason, IP and a hashed email only", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		auditAuthEndpoint({
			path: "/sign-in/email",
			body: { email: "victim@example.com", password: "hunter2" },
			request: request("203.0.113.9"),
			context: {
				returned: new APIError("UNAUTHORIZED", {
					message: "Invalid email or password",
					code: "INVALID_EMAIL_OR_PASSWORD",
				}),
			},
		});
		const line = warn.mock.calls[0][0] as string;
		expect(JSON.parse(line)).toMatchObject({
			event: "auth.sign-in.email",
			outcome: "failure",
			status: 401,
			reason: "INVALID_EMAIL_OR_PASSWORD",
			ip: "203.0.113.9",
			emailHash: hashEmail("victim@example.com"),
		});
		expect(line).not.toContain("victim@example.com");
		expect(line).not.toContain("hunter2");
	});

	it("logs a successful sign-in with the new session's user", () => {
		const info = vi.spyOn(console, "info").mockImplementation(() => {});
		auditAuthEndpoint({
			path: "/sign-in/email",
			body: { email: "a@b.co" },
			request: request("198.51.100.7"),
			context: {
				returned: { token: "session-token-value" },
				newSession: { user: { id: "user_1" } },
			},
		});
		const line = info.mock.calls[0][0] as string;
		expect(JSON.parse(line)).toMatchObject({
			outcome: "success",
			userId: "user_1",
			status: 200,
		});
		expect(line).not.toContain("session-token-value");
	});

	it("names admin actions and records their target", () => {
		const info = vi.spyOn(console, "info").mockImplementation(() => {});
		auditAuthEndpoint({
			path: "/admin/impersonate-user",
			body: { userId: "user_2" },
			context: { returned: {}, session: { user: { id: "admin_1" } } },
		});
		expect(JSON.parse(info.mock.calls[0][0] as string)).toMatchObject({
			event: "auth.admin.impersonate-user",
			userId: "admin_1",
			targetUserId: "user_2",
		});
	});

	it("ignores endpoints outside the audit set", () => {
		const info = vi.spyOn(console, "info").mockImplementation(() => {});
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		auditAuthEndpoint({ path: "/get-session", context: { returned: {} } });
		expect(info).not.toHaveBeenCalled();
		expect(warn).not.toHaveBeenCalled();
	});
});

describe("hashEmail", () => {
	it("is stable, case-insensitive, and not the address", () => {
		const h = hashEmail("Victim@Example.com ");
		expect(h).toBe(hashEmail("victim@example.com"));
		expect(h).toMatch(/^[0-9a-f]{16}$/);
		expect(hashEmail(undefined)).toBeUndefined();
	});
});
