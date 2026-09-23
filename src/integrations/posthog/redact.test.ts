import { describe, expect, it } from "vitest";
import { redactSensitiveUrls } from "./provider";

describe("PostHog URL redaction", () => {
	it("redacts the reset token in URL properties", () => {
		const event = redactSensitiveUrls({
			uuid: "1",
			event: "$pageview",
			properties: {
				$current_url: "http://localhost:3000/reset-password?token=SECRET123",
				path: "/reset-password",
			},
			$set_once: {
				$initial_current_url:
					"https://devlinks.app/reset-password?token=SECRET123&x=1",
			},
		} as never);
		const json = JSON.stringify(event);
		expect(json).not.toContain("SECRET123");
		expect(event?.properties.$current_url).toContain("token=%5Bredacted%5D");
		expect(event?.properties.path).toBe("/reset-password");
	});

	it("leaves ordinary URLs untouched", () => {
		const url = "http://localhost:3000/dashboard?tab=links";
		const event = redactSensitiveUrls({
			uuid: "2",
			event: "$pageview",
			properties: { $current_url: url },
		} as never);
		expect(event?.properties.$current_url).toBe(url);
	});
});
