import { beforeAll, describe, expect, it, vi } from "vitest";

// Only the pure key derivation is tested here; the limiter itself was
// verified against the real database (atomic under concurrent requests).
vi.mock("@/db/index", () => ({ db: {} }));

const { limitKey } = await import("./rate-limit.server");

beforeAll(() => {
	process.env.BETTER_AUTH_SECRET = "test-secret-for-rate-limit-keys-01";
});

describe("limitKey", () => {
	it("prefixes the scope and never stores the identifier in clear", () => {
		const key = limitKey("contact", "203.0.113.9");
		expect(key).toMatch(/^contact:[0-9a-f]{32}$/);
		expect(key).not.toContain("203.0.113.9");
	});

	it("is stable per identifier and distinct across scopes/identifiers", () => {
		expect(limitKey("view", "1.1.1.1")).toBe(limitKey("view", "1.1.1.1"));
		expect(limitKey("view", "1.1.1.1")).not.toBe(limitKey("click", "1.1.1.1"));
		expect(limitKey("view", "1.1.1.1")).not.toBe(limitKey("view", "1.1.1.2"));
	});
});
