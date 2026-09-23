import { describe, expect, it, vi } from "vitest";
import { csrfMiddleware } from "./start";

// Runs the real TanStack Start CSRF middleware (as configured in start.ts)
// against synthetic requests.
type Ctx = {
	request: Request;
	handlerType: "serverFn" | "router";
	next: () => Promise<unknown>;
};
const server = (
	csrfMiddleware as unknown as {
		options: { server: (ctx: Ctx) => Promise<unknown> };
	}
).options.server;

const APP = "https://devlinks.test";
const PASSED = Symbol("next");

async function run(
	headers: Record<string, string>,
	handlerType: Ctx["handlerType"] = "serverFn",
	method = "POST",
) {
	const next = vi.fn(async () => PASSED);
	const result = await server({
		request: new Request(`${APP}/_serverFn/abc`, { method, headers }),
		handlerType,
		next,
	});
	return {
		passed: result === PASSED,
		status: result instanceof Response ? result.status : null,
	};
}

describe("CSRF middleware (server functions)", () => {
	it.each([
		["Sec-Fetch-Site: cross-site", { "Sec-Fetch-Site": "cross-site" }],
		// Sibling subdomain: SameSite=Lax would still send the cookie.
		["Sec-Fetch-Site: same-site", { "Sec-Fetch-Site": "same-site" }],
		["foreign Origin", { Origin: "https://evil.example" }],
		["foreign Referer", { Referer: "https://evil.example/page" }],
		["lookalike Referer prefix", { Referer: `${APP}.evil.example/` }],
		["no origin information at all", {}],
	])("rejects %s with 403", async (_label, headers) => {
		expect(await run(headers)).toEqual({ passed: false, status: 403 });
	});

	it.each([
		["Sec-Fetch-Site: same-origin", { "Sec-Fetch-Site": "same-origin" }],
		["same Origin (no Fetch Metadata)", { Origin: APP }],
		["same-origin Referer", { Referer: `${APP}/dashboard` }],
	])("allows %s", async (_label, headers) => {
		expect(await run(headers)).toEqual({ passed: true, status: null });
	});

	it("also checks GET server functions", async () => {
		expect(
			await run({ "Sec-Fetch-Site": "cross-site" }, "serverFn", "GET"),
		).toEqual({ passed: false, status: 403 });
	});

	it("leaves pages and server routes alone (links, OAuth callbacks, webhooks)", async () => {
		expect(
			await run({ "Sec-Fetch-Site": "cross-site" }, "router", "GET"),
		).toEqual({ passed: true, status: null });
		expect(await run({}, "router")).toEqual({ passed: true, status: null });
	});
});
