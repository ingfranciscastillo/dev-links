import type { DockerhubPayload, FetchResult } from "./types";

export async function fetchDockerhub(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = input.handle.trim().replace(/^@/, "").toLowerCase();
	if (!handle) throw new Error("Empty Docker Hub username");
	const res = await fetch(
		`https://hub.docker.com/v2/repositories/${encodeURIComponent(handle)}/?page_size=20&ordering=-pull_count`,
		{
			headers: {
				Accept: "application/json",
				"User-Agent": "DevLinks-Integrations/1.0",
			},
		},
	);
	if (!res.ok) throw new Error(`Docker Hub ${res.status}`);
	const json = (await res.json()) as {
		results?: Array<Record<string, unknown>>;
	};
	const repos = (json.results ?? []).map((r) => ({
		name: (r.name as string) ?? "",
		namespace: (r.namespace as string) ?? handle,
		description: (r.description as string) ?? "",
		pulls: (r.pull_count as number) ?? 0,
		stars: (r.star_count as number) ?? 0,
		url: `https://hub.docker.com/r/${(r.namespace as string) ?? handle}/${(r.name as string) ?? ""}`,
		updated_at: (r.last_updated as string) ?? "",
	}));
	const payload: DockerhubPayload = {
		username: handle,
		url: `https://hub.docker.com/u/${handle}`,
		repos,
		total_pulls: repos.reduce((sum, r) => sum + r.pulls, 0),
	};
	return [
		{ kind: "repos", payload: payload as unknown as Record<string, unknown> },
	];
}
