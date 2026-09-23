import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// Server functions are public RPC endpoints. Every one of them must either
// attach authMiddleware or be listed here as intentionally public — so adding
// a new server function that forgets auth fails CI instead of shipping.
const PUBLIC_SERVER_FNS = new Set([
	"getSession", // returns null when signed out; used by route guards
	"getPublicProfile",
	"searchProfiles",
	"gradeGithubUsername",
	"sendContactMessage",
]);

const SRC = join(import.meta.dirname, "..");

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")
			? [path]
			: [];
	});
}

type ServerFn = { name: string; file: string; guarded: boolean };

function findServerFns(): ServerFn[] {
	const fns: ServerFn[] = [];
	for (const file of sourceFiles(SRC)) {
		const source = readFileSync(file, "utf8");
		const decl = /export const (\w+) = createServerFn\(/g;
		for (let m = decl.exec(source); m; m = decl.exec(source)) {
			// The builder chain up to the handler is where middleware attaches.
			const chain = source.slice(m.index, source.indexOf(".handler(", m.index));
			fns.push({
				name: m[1],
				file: relative(SRC, file),
				guarded: /\.middleware\(\[[^\]]*\bauthMiddleware\b/.test(chain),
			});
		}
	}
	return fns;
}

describe("server function authorization", () => {
	const fns = findServerFns();

	it("finds the server functions", () => {
		expect(fns.length).toBeGreaterThan(PUBLIC_SERVER_FNS.size);
	});

	it("every non-public server function uses authMiddleware", () => {
		const unguarded = fns
			.filter((fn) => !fn.guarded && !PUBLIC_SERVER_FNS.has(fn.name))
			.map((fn) => `${fn.file}: ${fn.name}`);
		expect(unguarded).toEqual([]);
	});

	it("the public allow-list has no stale entries", () => {
		const names = new Set(fns.map((fn) => fn.name));
		expect([...PUBLIC_SERVER_FNS].filter((n) => !names.has(n))).toEqual([]);
	});
});
