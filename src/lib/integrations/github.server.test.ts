import { describe, expect, it } from "vitest";
import { REPO_SLUG_RE } from "./github.server";

describe("REPO_SLUG_RE", () => {
	it.each(["vercel/next.js", "a-b/c_d.e", "owner/.github"])(
		"accepts %s",
		(slug) => {
			expect(REPO_SLUG_RE.test(slug)).toBe(true);
		},
	);

	// Anything that could steer the api.github.com request path elsewhere.
	it.each([
		"../rate_limit",
		"owner/..",
		"owner/.",
		"./repo",
		"owner/repo/../x",
		"owner/repo?per_page=1",
		"owner",
	])("rejects %s", (slug) => {
		expect(REPO_SLUG_RE.test(slug)).toBe(false);
	});
});
