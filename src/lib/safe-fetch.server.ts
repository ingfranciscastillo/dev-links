// Runs on the server only. Do NOT import from client-reachable modules at module scope.
//
// Outbound HTTP to a host a user chose (e.g. a Mastodon instance) — OWASP
// SSRF "case 2", arbitrary external targets. Plain fetch() isn't safe for
// this even with a hostname check up front:
// - it follows redirects, so a public host can 302 to http://127.0.0.1:9001;
// - the URL parser accepts shorthand IPs ("127.1", "2130706433", "0x7f.1")
//   that string checks miss;
// - a public-looking name can resolve to a private IP, including a
//   different answer at connect time than at check time (DNS rebinding).
// So this uses node:https with a custom `lookup` that validates the address
// actually being connected to, never follows redirects, and bounds time and
// response size.

import { lookup as dnsLookup } from "node:dns";
import { request } from "node:https";
import { BlockList, isIP, type LookupFunction } from "node:net";

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024;

// Everything that isn't ordinary public unicast.
const blocked = new BlockList();
for (const [net, prefix] of [
	["0.0.0.0", 8], // "this network"
	["10.0.0.0", 8], // private
	["100.64.0.0", 10], // carrier-grade NAT
	["127.0.0.0", 8], // loopback (incl. the Lambda runtime API)
	["169.254.0.0", 16], // link-local / cloud metadata
	["172.16.0.0", 12], // private
	["192.0.0.0", 24], // IETF protocol assignments
	["192.0.2.0", 24], // documentation
	["192.168.0.0", 16], // private
	["198.18.0.0", 15], // benchmarking
	["198.51.100.0", 24], // documentation
	["203.0.113.0", 24], // documentation
	["224.0.0.0", 4], // multicast
	["240.0.0.0", 4], // reserved + broadcast
] as const) {
	blocked.addSubnet(net, prefix, "ipv4");
}
for (const [net, prefix] of [
	["::", 128], // unspecified
	["::1", 128], // loopback
	// No ::ffff:0:0/96 rule: BlockList already checks IPv4-mapped addresses
	// against the IPv4 rules above, and that subnet would also match every
	// plain IPv4 address.
	["64:ff9b::", 96], // NAT64 — embeds an IPv4 address
	["100::", 64], // discard
	["2001::", 32], // Teredo — embeds an IPv4 address
	["2001:db8::", 32], // documentation
	["2002::", 16], // 6to4 — embeds an IPv4 address
	["fc00::", 7], // unique local
	["fe80::", 10], // link-local
	["ff00::", 8], // multicast
] as const) {
	blocked.addSubnet(net, prefix, "ipv6");
}

export function isPublicAddress(address: string): boolean {
	const family = isIP(address);
	if (family === 4) return !blocked.check(address, "ipv4");
	if (family === 6) return !blocked.check(address, "ipv6");
	return false;
}

export class UnsafeTargetError extends Error {}

// Validates whatever DNS returns for the connection itself, so a rebinding
// answer at connect time is caught too. Handles both lookup call shapes
// (single address, or `all: true` from happy-eyeballs).
const safeLookup: LookupFunction = (hostname, options, callback) => {
	dnsLookup(hostname, { ...options, all: true }, (err, addresses) => {
		if (err) return callback(err, "", 4);
		const list = addresses as Array<{ address: string; family: number }>;
		const bad = list.find((a) => !isPublicAddress(a.address));
		if (list.length === 0 || bad) {
			return callback(
				new UnsafeTargetError(
					`${hostname} does not resolve to a public address`,
				),
				"",
				4,
			);
		}
		if (options.all) return callback(null, list as never);
		callback(null, list[0].address, list[0].family);
	});
};

export type SafeResponse = { status: number; ok: boolean; text: string };

// GET only, https only, host must be a plain hostname or public IP.
export function safeGet(
	rawUrl: string,
	init: {
		headers?: Record<string, string>;
		timeoutMs?: number;
		maxBytes?: number;
	} = {},
): Promise<SafeResponse> {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		return Promise.reject(new UnsafeTargetError("Invalid URL"));
	}
	if (url.protocol !== "https:" || url.username || url.password || url.port) {
		return Promise.reject(
			new UnsafeTargetError("Only plain https URLs are allowed"),
		);
	}
	// Literal IPs skip DNS (and therefore safeLookup), so check them here.
	// url.hostname is already normalised ("127.1" -> "127.0.0.1").
	const host = url.hostname.replace(/^\[|\]$/g, "");
	if (isIP(host) && !isPublicAddress(host)) {
		return Promise.reject(
			new UnsafeTargetError("Target address is not public"),
		);
	}
	const hostname = host.toLowerCase();
	if (hostname === "localhost" || hostname.endsWith(".localhost")) {
		return Promise.reject(new UnsafeTargetError("Target host is not allowed"));
	}

	const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const maxBytes = init.maxBytes ?? DEFAULT_MAX_BYTES;

	return new Promise((resolve, reject) => {
		const req = request(
			url,
			{
				method: "GET",
				headers: init.headers,
				lookup: safeLookup,
				timeout: timeoutMs,
			},
			(res) => {
				const status = res.statusCode ?? 0;
				// No redirects: a 3xx is returned as-is (not ok), never followed.
				const chunks: Buffer[] = [];
				let size = 0;
				res.on("data", (chunk: Buffer) => {
					size += chunk.length;
					if (size > maxBytes) {
						req.destroy(new Error("Response too large"));
						return;
					}
					chunks.push(chunk);
				});
				res.on("end", () =>
					resolve({
						status,
						ok: status >= 200 && status < 300,
						text: Buffer.concat(chunks).toString("utf8"),
					}),
				);
				res.on("error", reject);
			},
		);
		// Overall deadline, not just socket idle time.
		const deadline = setTimeout(
			() => req.destroy(new Error("Request timed out")),
			timeoutMs,
		);
		req.on("timeout", () => req.destroy(new Error("Request timed out")));
		req.on("error", reject);
		req.on("close", () => clearTimeout(deadline));
		req.end();
	});
}
