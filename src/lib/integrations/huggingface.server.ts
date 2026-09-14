import type { FetchResult, HuggingfacePayload } from "./types";

type HfModel = {
	id: string;
	likes?: number;
	downloads?: number;
	pipeline_tag?: string | null;
};

type HfOverview = {
	user?: string;
	fullname?: string;
	avatarUrl?: string;
	details?: string;
	isPro?: boolean;
	numFollowers?: number;
	numModels?: number;
	numDatasets?: number;
	numSpaces?: number;
	numLikes?: number;
};

const UA = "DevLinks-Integrations/1.0";

export async function fetchHuggingface(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = input.handle.trim().replace(/^@/, "");
	if (!handle) throw new Error("Empty Hugging Face username");

	const headers = { Accept: "application/json", "User-Agent": UA };

	const [overviewRes, modelsRes] = await Promise.all([
		fetch(
			`https://huggingface.co/api/users/${encodeURIComponent(handle)}/overview`,
			{ headers },
		),
		fetch(
			`https://huggingface.co/api/models?author=${encodeURIComponent(handle)}&sort=downloads&direction=-1&limit=8`,
			{ headers },
		),
	]);

	if (!overviewRes.ok) {
		throw new Error(`Hugging Face ${overviewRes.status}`);
	}

	const overview = (await overviewRes.json()) as HfOverview;
	const models = modelsRes.ok ? ((await modelsRes.json()) as HfModel[]) : [];

	const payload: HuggingfacePayload = {
		profile: {
			username: overview.user ?? handle,
			fullname: overview.fullname ?? null,
			avatar_url: overview.avatarUrl ?? null,
			bio: overview.details ?? null,
			is_pro: overview.isPro ?? false,
			followers: overview.numFollowers ?? 0,
			models_count: overview.numModels ?? 0,
			datasets_count: overview.numDatasets ?? 0,
			spaces_count: overview.numSpaces ?? 0,
			likes: overview.numLikes ?? 0,
			url: `https://huggingface.co/${handle}`,
		},
		models: models.slice(0, 8).map((m) => ({
			id: m.id,
			// m.id is "author/model-name" — show just the model-name part.
			name: m.id.includes("/") ? m.id.split("/").slice(1).join("/") : m.id,
			likes: m.likes ?? 0,
			downloads: m.downloads ?? 0,
			pipeline_tag: m.pipeline_tag ?? null,
			url: `https://huggingface.co/${m.id}`,
		})),
	};

	return [
		{ kind: "profile", payload: payload as unknown as Record<string, unknown> },
	];
}
