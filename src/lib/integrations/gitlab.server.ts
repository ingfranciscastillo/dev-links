import type { FetchResult, GitlabPayload } from "./types";

type GitlabUser = {
	id: number;
	username: string;
	name: string | null;
	bio: string | null;
	avatar_url: string | null;
	web_url: string;
};

type GitlabProject = {
	name: string;
	path_with_namespace: string;
	description: string | null;
	star_count: number;
	forks_count: number;
	web_url: string;
	last_activity_at: string;
};

export async function fetchGitlab(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = input.handle.trim().replace(/^@/, "");
	if (!handle) throw new Error("Empty GitLab username");

	const headers = {
		Accept: "application/json",
		"User-Agent": "DevLinks-Integrations/1.0",
	};
	const userRes = await fetch(
		`https://gitlab.com/api/v4/users?username=${encodeURIComponent(handle)}`,
		{ headers },
	);
	if (!userRes.ok) throw new Error(`GitLab ${userRes.status}`);
	const users = (await userRes.json()) as GitlabUser[];
	const user = users[0];
	if (!user) throw new Error("GitLab user not found");

	const projRes = await fetch(
		`https://gitlab.com/api/v4/users/${user.id}/projects?per_page=20&order_by=last_activity_at&visibility=public`,
		{ headers },
	);
	const projects = projRes.ok
		? ((await projRes.json()) as GitlabProject[])
		: [];

	const repos = projects
		.map((p) => ({
			name: p.name,
			full_name: p.path_with_namespace,
			description: p.description ?? "",
			stars: p.star_count ?? 0,
			forks: p.forks_count ?? 0,
			url: p.web_url,
			updated_at: p.last_activity_at ?? "",
		}))
		.sort((a, b) => b.stars - a.stars);

	const payload: GitlabPayload = {
		profile: {
			username: user.username,
			name: user.name,
			bio: user.bio,
			avatar_url: user.avatar_url,
			url: user.web_url,
		},
		repos,
		totals: {
			stars: repos.reduce((s, r) => s + r.stars, 0),
			projects: repos.length,
		},
	};

	return [
		{ kind: "profile", payload: payload as unknown as Record<string, unknown> },
	];
}
