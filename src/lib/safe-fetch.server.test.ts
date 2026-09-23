import { describe, expect, it, vi } from "vitest";

// Pretend every hostname resolves to whatever the test sets, so the
// connect-time check can be exercised without touching the network.
const dnsAnswer = vi.hoisted(() => ({
	addresses: [] as Array<{ address: string; family: number }>,
}));
vi.mock("node:dns", async (importOriginal) => {
	const actual = await importOriginal<typeof import("node:dns")>();
	return {
		...actual,
		lookup: (
			_host: string,
			_opts: unknown,
			cb: (err: null, addrs: typeof dnsAnswer.addresses) => void,
		) => cb(null, dnsAnswer.addresses),
	};
});

const { isPublicAddress, safeGet, UnsafeTargetError } = await import(
	"./safe-fetch.server"
);

describe("isPublicAddress", () => {
	it.each(["1.1.1.1", "93.184.216.34", "2606:4700:4700::1111"])(
		"allows %s",
		(ip) => expect(isPublicAddress(ip)).toBe(true),
	);

	it.each([
		"127.0.0.1",
		"10.1.2.3",
		"172.16.0.1",
		"192.168.1.1",
		"169.254.169.254",
		"100.64.0.1",
		"0.0.0.0",
		"224.0.0.1",
		"::1",
		"::",
		"fe80::1",
		"fd00::1",
		"::ffff:127.0.0.1",
		"64:ff9b::7f00:1",
		"2002:7f00:1::",
		"not-an-ip",
	])("blocks %s", (ip) => expect(isPublicAddress(ip)).toBe(false));
});

describe("safeGet", () => {
	it.each([
		"http://example.com/",
		"https://user:pw@example.com/",
		"https://example.com:8443/",
		"https://localhost/",
		"https://api.localhost/",
		"https://127.0.0.1/",
		"https://127.1/",
		"https://2130706433/",
		"https://0x7f.1/",
		"https://[::1]/",
		"https://[::ffff:127.0.0.1]/",
		"https://169.254.169.254/latest/meta-data/",
		"not a url",
	])("rejects %s before connecting", async (url) => {
		await expect(safeGet(url)).rejects.toBeInstanceOf(UnsafeTargetError);
	});

	it("rejects a public-looking host that resolves to a private address", async () => {
		dnsAnswer.addresses = [{ address: "127.0.0.1", family: 4 }];
		await expect(safeGet("https://rebind.example/")).rejects.toBeInstanceOf(
			UnsafeTargetError,
		);
	});

	it("rejects when any resolved address is private", async () => {
		dnsAnswer.addresses = [
			{ address: "93.184.216.34", family: 4 },
			{ address: "10.0.0.5", family: 4 },
		];
		await expect(safeGet("https://mixed.example/")).rejects.toBeInstanceOf(
			UnsafeTargetError,
		);
	});
});
