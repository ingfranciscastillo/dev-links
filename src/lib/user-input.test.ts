import { describe, expect, it } from "vitest";
import { allowedImageOrigins, validateUserInput } from "./user-input";

const origins = allowedImageOrigins("https://pub-abc.r2.dev");

describe("validateUserInput (better-auth sign-up / update-user)", () => {
	it("accepts normal values", () => {
		expect(validateUserInput({ name: "Ada Lovelace" }, origins)).toBeNull();
		expect(
			validateUserInput(
				{ image: "https://pub-abc.r2.dev/avatars/u1?v=2" },
				origins,
			),
		).toBeNull();
		expect(
			validateUserInput(
				{ image: "https://avatars.githubusercontent.com/u/1?v=4" },
				origins,
			),
		).toBeNull();
		expect(validateUserInput({ image: null }, origins)).toBeNull();
		expect(validateUserInput(undefined, origins)).toBeNull();
	});

	it.each([
		["too-short name", { name: "A" }],
		["too-long name", { name: "x".repeat(61) }],
		["too-long display name", { displayName: "x".repeat(61) }],
		["non-string name", { name: 42 }],
		["external image host", { image: "https://tracker.example/pixel.png" }],
		["data: image", { image: `data:image/png;base64,${"A".repeat(5000)}` }],
		["javascript: image", { image: "javascript:alert(1)" }],
		["lookalike host", { image: "https://pub-abc.r2.dev.evil.example/x.png" }],
	])("rejects %s", (_label, body) => {
		expect(validateUserInput(body, origins)).not.toBeNull();
	});
});
