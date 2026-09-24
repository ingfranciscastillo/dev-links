import { afterEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./email";

// RESEND_API_KEY is unset in tests, so sendEmail takes the "no provider" path.
const RESET_URL = "https://devlinks.test/reset-password/SECRET_TOKEN";

afterEach(() => {
	vi.restoreAllMocks();
	vi.unstubAllEnvs();
});

function captureConsole() {
	const out: string[] = [];
	for (const level of ["log", "info", "warn", "error"] as const) {
		vi.spyOn(console, level).mockImplementation((...args) => {
			out.push(args.map((a) => JSON.stringify(a)).join(" "));
		});
	}
	return out;
}

describe("sendEmail without a provider", () => {
	it("never prints the email body or recipient in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		const out = captureConsole();
		await sendEmail({
			to: "victim@example.com",
			subject: "Reset your password",
			html: `<a href="${RESET_URL}">reset</a>`,
			text: `Reset: ${RESET_URL}`,
		});
		const logged = out.join("\n");
		expect(logged).not.toContain("SECRET_TOKEN");
		expect(logged).not.toContain("victim@example.com");
	});

	it("still prints the link locally so dev sign-up/reset flows work", async () => {
		vi.stubEnv("NODE_ENV", "development");
		const out = captureConsole();
		await sendEmail({
			to: "dev@example.com",
			subject: "Reset",
			html: "",
			text: `Reset: ${RESET_URL}`,
		});
		expect(out.join("\n")).toContain("SECRET_TOKEN");
	});
});
