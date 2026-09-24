import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIp, securityLog } from "./security-log";

afterEach(() => vi.restoreAllMocks());

describe("securityLog", () => {
	it("writes one JSON line with when/what/outcome", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		securityLog("auth.sign-in.email", "failure", { ip: "1.2.3.4" });
		expect(warn).toHaveBeenCalledTimes(1);
		const line = warn.mock.calls[0][0] as string;
		expect(line.split("\n")).toHaveLength(1);
		expect(JSON.parse(line)).toMatchObject({
			type: "security",
			event: "auth.sign-in.email",
			outcome: "failure",
			ip: "1.2.3.4",
		});
		expect(Date.parse(JSON.parse(line).ts)).not.toBeNaN();
	});

	it("uses console.info for successes", () => {
		const info = vi.spyOn(console, "info").mockImplementation(() => {});
		securityLog("auth.session_created", "success");
		expect(info).toHaveBeenCalledTimes(1);
	});

	it("drops anything that looks like a credential, at any depth", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		securityLog("x", "failure", {
			token: "tok",
			password: "hunter2",
			accessToken: "a",
			nested: { sessionToken: "s", cookie: "c", ok: 1 },
		});
		const line = warn.mock.calls[0][0] as string;
		for (const secret of ["tok", "hunter2", '"a"', '"s"', '"c"']) {
			expect(line).not.toContain(secret);
		}
		expect(JSON.parse(line).nested).toEqual({ ok: 1 });
	});

	it("can't be used to forge extra log lines", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		securityLog("x", "failure", {
			reason: 'bad\n{"type":"security","event":"auth.admin.set-role"}',
		});
		const line = warn.mock.calls[0][0] as string;
		expect(line).not.toContain("\n");
		expect(JSON.parse(line).event).toBe("x");
	});

	it("truncates long values", () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		securityLog("x", "failure", { ua: "a".repeat(5000) });
		expect(JSON.parse(warn.mock.calls[0][0] as string).ua).toHaveLength(300);
	});
});

describe("clientIp", () => {
	it("takes the first X-Forwarded-For hop, then X-Real-IP", () => {
		expect(
			clientIp(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" })),
		).toBe("9.9.9.9");
		expect(clientIp(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
		expect(clientIp(new Headers())).toBeNull();
	});
});
