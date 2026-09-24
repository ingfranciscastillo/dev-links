import { afterEach, describe, expect, it, vi } from "vitest";
import {
	errorSanitizerMiddleware,
	GENERIC_ERROR_MESSAGE,
	isInternalError,
} from "./error-middleware";

afterEach(() => vi.restoreAllMocks());

const server = (
	errorSanitizerMiddleware as unknown as {
		options: {
			server: (ctx: { next: () => Promise<unknown> }) => Promise<unknown>;
		};
	}
).options.server;

function drizzleError() {
	const e = new Error(
		'Failed query: select "email" from "user" where "id" = $1\nparams: user_123',
	);
	e.name = "DrizzleQueryError";
	return e;
}

describe("isInternalError", () => {
	it("flags database and programming errors", () => {
		expect(isInternalError(drizzleError())).toBe(true);
		expect(isInternalError(new TypeError("x is undefined"))).toBe(true);
		expect(
			isInternalError(Object.assign(new Error("duplicate"), { code: "23505" })),
		).toBe(true);
	});

	it("keeps our own user-facing errors", () => {
		expect(isInternalError(new Error("Unauthorized"))).toBe(false);
		expect(isInternalError(new Error("Free plan is limited to 5 links."))).toBe(
			false,
		);
		expect(isInternalError("not an error")).toBe(false);
	});
});

describe("errorSanitizerMiddleware", () => {
	it("replaces a thrown DB error with a generic one and logs the detail", async () => {
		const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
		const thrown = await server({
			next: async () => {
				throw drizzleError();
			},
		}).catch((e: unknown) => e);
		expect((thrown as Error).message).toBe(GENERIC_ERROR_MESSAGE);
		expect((thrown as Error).message).not.toContain("select");
		const log = JSON.parse(warn.mock.calls[0][0] as string);
		expect(log).toMatchObject({ event: "server_fn.internal_error" });
		expect(log.detail).toContain("Failed query");
	});

	it("also sanitizes an error carried in the result", async () => {
		vi.spyOn(console, "warn").mockImplementation(() => {});
		const result = (await server({
			next: async () => ({ error: drizzleError() }),
		})) as { error: Error };
		expect(result.error.message).toBe(GENERIC_ERROR_MESSAGE);
	});

	it("passes our own errors and normal results through untouched", async () => {
		const own = new Error("Unauthorized");
		await expect(
			server({
				next: async () => {
					throw own;
				},
			}),
		).rejects.toBe(own);
		const ok = { result: { links: [] } };
		expect(await server({ next: async () => ok })).toBe(ok);
	});
});
