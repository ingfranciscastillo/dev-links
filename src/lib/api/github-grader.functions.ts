import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { type GraderReport, gradeGithubProfile } from "@/lib/github-grader";
import { fetchGithub } from "@/lib/integrations/github.server";
import type { GithubPayload } from "@/lib/integrations/types";

const UA = "DevLinks-GithubGrader/1.0";

export type GithubGraderResult = {
	username: string;
	profile: GithubPayload["profile"];
	totals: GithubPayload["totals"];
	topLanguages: GithubPayload["topLanguages"];
	report: GraderReport;
};

export type GithubGraderOutcome =
	| { ok: true; data: GithubGraderResult }
	| { ok: false; reason: "not_found" | "rate_limited" | "fetch_failed" };

// In-memory only — best-effort per server instance, resets on redeploy/cold
// start. Good enough to stop a burst of repeat lookups from burning through
// the shared GITHUB_TOKEN budget that the real product's integrations also
// use; not a substitute for a distributed limiter under real traffic.
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { expires: number; data: GithubGraderResult }>();

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX = 15;
const hits = new Map<string, number[]>();

function allowRequest(ip: string): boolean {
	const now = Date.now();
	const windowStart = now - RATE_LIMIT_WINDOW_MS;
	const recent = (hits.get(ip) ?? []).filter((t) => t > windowStart);
	if (recent.length >= RATE_LIMIT_MAX) return false;
	recent.push(now);
	hits.set(ip, recent);
	return true;
}

async function hasProfileReadme(username: string): Promise<boolean> {
	const token = process.env.GITHUB_TOKEN;
	const res = await fetch(
		`https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(username)}`,
		{
			headers: {
				"User-Agent": UA,
				Accept: "application/vnd.github+json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		},
	);
	return res.ok;
}

const inputSchema = z.object({
	username: z
		.string()
		.trim()
		.min(1)
		.max(39)
		.regex(/^[a-zA-Z0-9-]+$/, "Invalid GitHub username"),
});

export const gradeGithubUsername = createServerFn({ method: "GET" })
	.validator((raw) => inputSchema.parse(raw))
	.handler(async ({ data }): Promise<GithubGraderOutcome> => {
		const username = data.username.toLowerCase();

		const cached = cache.get(username);
		if (cached && cached.expires > Date.now()) {
			return { ok: true, data: cached.data };
		}

		// xForwardedFor is intentionally omitted: that header's first entry is
		// client-supplied and trivially spoofable per request, which let a
		// single visitor bypass this limiter and exhaust the shared
		// GITHUB_TOKEN. The raw socket address below can't be spoofed.
		const ip = getRequestIP() ?? "0.0.0.0";
		if (!allowRequest(ip)) {
			return { ok: false, reason: "rate_limited" };
		}

		let fetched: Awaited<ReturnType<typeof fetchGithub>>;
		try {
			fetched = await fetchGithub({ handle: username, config: {} });
		} catch (error) {
			if (error instanceof Error && error.message.startsWith("GitHub 404")) {
				return { ok: false, reason: "not_found" };
			}
			console.warn("[github-grader] fetch failed:", error);
			return { ok: false, reason: "fetch_failed" };
		}

		const githubPayload = fetched[0]?.payload as unknown as
			| GithubPayload
			| undefined;
		if (!githubPayload) return { ok: false, reason: "fetch_failed" };

		const readme = await hasProfileReadme(username);
		const report = gradeGithubProfile(githubPayload, readme);

		const result: GithubGraderResult = {
			username: githubPayload.profile.login,
			profile: githubPayload.profile,
			totals: githubPayload.totals,
			topLanguages: githubPayload.topLanguages,
			report,
		};

		cache.set(username, { expires: Date.now() + CACHE_TTL_MS, data: result });
		return { ok: true, data: result };
	});
