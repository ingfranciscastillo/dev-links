// Runs on the server only. Do NOT import from client-reachable modules at module scope.

import { fetchBluesky } from "./bluesky.server";
import { fetchDevto } from "./devto.server";
import { fetchDockerhub } from "./dockerhub.server";
import { fetchGithub } from "./github.server";
import { fetchLeetcode } from "./leetcode.server";
import { fetchMastodon } from "./mastodon.server";
import { fetchMedium } from "./medium.server";
import { fetchNpm } from "./npm.server";
import { fetchStackOverflow } from "./stackoverflow.server";
import type { FetchResult, Provider } from "./types";
import { fetchWakatime } from "./wakatime.server";
import { fetchYoutube } from "./youtube.server";

export async function runProviderFetch(
	provider: Provider,
	input: { handle: string; config: Record<string, unknown> },
): Promise<FetchResult[]> {
	switch (provider) {
		case "github":
			return fetchGithub({
				handle: input.handle,
				config: input.config as { pinned?: string[] },
			});
		case "devto":
			return fetchDevto({ handle: input.handle });
		case "medium":
			return fetchMedium({ handle: input.handle });
		case "stackoverflow":
			return fetchStackOverflow({ handle: input.handle });
		case "wakatime":
			return fetchWakatime({ handle: input.handle });
		case "leetcode":
			return fetchLeetcode({ handle: input.handle });
		case "npm":
			return fetchNpm({ handle: input.handle });
		case "bluesky":
			return fetchBluesky({ handle: input.handle });
		case "mastodon":
			return fetchMastodon({ handle: input.handle });
		case "dockerhub":
			return fetchDockerhub({ handle: input.handle });
		case "youtube":
			return fetchYoutube({ handle: input.handle });
	}
}
