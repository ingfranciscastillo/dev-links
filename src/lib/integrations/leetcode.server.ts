import type { FetchResult, LeetcodePayload } from "./types";

const QUERY = `query userStats($username: String!) {
  matchedUser(username: $username) {
    username
    profile { ranking }
    submitStatsGlobal { acSubmissionNum { difficulty count } }
  }
  allQuestionsCount { difficulty count }
}`;

export async function fetchLeetcode(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = input.handle.trim().replace(/^@/, "");
	if (!handle) throw new Error("Empty LeetCode username");
	const res = await fetch("https://leetcode.com/graphql", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			Referer: `https://leetcode.com/${handle}/`,
			"User-Agent": "DevLinks-Integrations/1.0",
		},
		body: JSON.stringify({ query: QUERY, variables: { username: handle } }),
	});
	if (!res.ok) throw new Error(`LeetCode ${res.status}`);
	const json = (await res.json()) as {
		data?: {
			matchedUser: {
				username: string;
				profile: { ranking: number | null } | null;
				submitStatsGlobal: {
					acSubmissionNum: Array<{ difficulty: string; count: number }>;
				};
			} | null;
			allQuestionsCount: Array<{ difficulty: string; count: number }>;
		};
	};
	const user = json.data?.matchedUser;
	if (!user) throw new Error("LeetCode user not found");

	const pick = (
		rows: Array<{ difficulty: string; count: number }> | undefined,
		key: string,
	) => rows?.find((r) => r.difficulty.toLowerCase() === key)?.count ?? 0;

	const ac = user.submitStatsGlobal?.acSubmissionNum ?? [];
	const all = json.data?.allQuestionsCount ?? [];
	const payload: LeetcodePayload = {
		username: user.username,
		url: `https://leetcode.com/${user.username}/`,
		ranking: user.profile?.ranking ?? null,
		solved: {
			all: pick(ac, "all"),
			easy: pick(ac, "easy"),
			medium: pick(ac, "medium"),
			hard: pick(ac, "hard"),
		},
		totals: {
			all: pick(all, "all"),
			easy: pick(all, "easy"),
			medium: pick(all, "medium"),
			hard: pick(all, "hard"),
		},
	};
	return [
		{ kind: "stats", payload: payload as unknown as Record<string, unknown> },
	];
}
