// Runs on the server only. Do NOT import from client-reachable modules at module scope.

import { fetchDevto } from "./devto.server";
import { fetchGithub } from "./github.server";
import { fetchHashnode } from "./hashnode.server";
import { fetchMedium } from "./medium.server";
import { fetchStackOverflow } from "./stackoverflow.server";
import type { FetchResult, Provider } from "./types";

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
		case "hashnode":
			return fetchHashnode({
				handle: input.handle,
				config: input.config as { host?: string },
			});
		case "medium":
			return fetchMedium({ handle: input.handle });
		case "stackoverflow":
			return fetchStackOverflow({ handle: input.handle });
	}
}
