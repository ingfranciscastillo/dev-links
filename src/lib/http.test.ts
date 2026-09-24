import { describe, expect, it } from "vitest";
import { methodNotAllowed, requireJson } from "./http";

describe("methodNotAllowed", () => {
	it("answers every other method with 405 and an Allow header", () => {
		const handlers = methodNotAllowed(["POST"]);
		expect(Object.keys(handlers).sort()).toEqual(
			["DELETE", "GET", "OPTIONS", "PATCH", "PUT"].sort(),
		);
		const res = handlers.PUT?.();
		expect(res?.status).toBe(405);
		expect(res?.headers.get("Allow")).toBe("POST");
	});

	it("never overrides an allowed method and advertises HEAD with GET", () => {
		const handlers = methodNotAllowed(["GET", "POST"]);
		expect(handlers.GET).toBeUndefined();
		expect(handlers.POST).toBeUndefined();
		expect(handlers.DELETE?.().headers.get("Allow")).toBe("GET, POST, HEAD");
	});
});

describe("requireJson", () => {
	const req = (type?: string) =>
		new Request("https://devlinks.test/api/x", {
			method: "POST",
			headers: type ? { "Content-Type": type } : {},
			body: "{}",
		});

	it("accepts JSON (with or without charset)", () => {
		expect(requireJson(req("application/json"))).toBeNull();
		expect(requireJson(req("application/json; charset=utf-8"))).toBeNull();
	});

	it.each([
		"text/plain",
		"application/x-www-form-urlencoded",
		"multipart/form-data",
		undefined,
	])("rejects %s with 415", (type) => {
		expect(requireJson(req(type))?.status).toBe(415);
	});
});
