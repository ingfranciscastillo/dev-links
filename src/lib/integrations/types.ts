export type Provider =
	| "github"
	| "devto"
	| "medium"
	| "stackoverflow"
	| "wakatime"
	| "leetcode"
	| "npm"
	| "bluesky"
	| "mastodon"
	| "dockerhub"
	| "youtube";

export const PROVIDERS: Provider[] = [
	"github",
	"devto",
	"medium",
	"stackoverflow",
	"wakatime",
	"leetcode",
	"npm",
	"bluesky",
	"mastodon",
	"dockerhub",
	"youtube",
];

export const PROVIDER_LABEL: Record<Provider, string> = {
	github: "GitHub",
	devto: "Dev.to",
	medium: "Medium",
	stackoverflow: "Stack Overflow",
	wakatime: "WakaTime",
	leetcode: "LeetCode",
	npm: "npm",
	bluesky: "Bluesky",
	mastodon: "Mastodon",
	dockerhub: "Docker Hub",
	youtube: "YouTube",
};

export type ProviderCategory = "code" | "writing" | "social" | "containers";

export const PROVIDER_CATEGORY: Record<Provider, ProviderCategory> = {
	github: "code",
	wakatime: "code",
	leetcode: "code",
	npm: "code",
	devto: "writing",
	medium: "writing",
	stackoverflow: "writing",
	youtube: "writing",
	bluesky: "social",
	mastodon: "social",
	dockerhub: "containers",
};

export const CATEGORY_LABEL: Record<ProviderCategory, string> = {
	code: "Code",
	writing: "Writing & talks",
	social: "Social",
	containers: "Containers",
};

export type IntegrationPayload = Record<string, unknown>;

export type FetchResult = {
	kind: string;
	payload: IntegrationPayload;
	expiresInMs?: number;
};

// Discriminated cache payloads for consumers.
export type GithubPayload = {
	profile: {
		login: string;
		name: string | null;
		bio: string | null;
		avatar_url: string;
		followers: number;
		following: number;
		public_repos: number;
		html_url: string;
	};
	repos: Array<{
		name: string;
		full_name: string;
		description: string | null;
		stars: number;
		forks: number;
		language: string | null;
		url: string;
		updated_at: string;
	}>;
	pinned: Array<{
		name: string;
		full_name: string;
		description: string | null;
		stars: number;
		forks: number;
		language: string | null;
		url: string;
	}>;
	heatmap: Array<{ date: string; level: number; count?: number }>;
	totals: { stars: number; forks: number };
	topLanguages: Array<{ language: string; count: number }>;
};

export type DevtoPayload = {
	articles: Array<{
		id: number;
		title: string;
		url: string;
		description: string;
		cover_image: string | null;
		reactions: number;
		page_views: number | null;
		reading_time_minutes: number;
		published_at: string;
		tags: string[];
	}>;
};

export type MediumPayload = {
	posts: Array<{
		title: string;
		url: string;
		summary: string;
		cover_image: string | null;
		published_at: string;
	}>;
};

export type StackOverflowPayload = {
	user: {
		display_name: string;
		reputation: number;
		profile_image: string | null;
		link: string;
		badges: { gold: number; silver: number; bronze: number };
	};
	answers: Array<{
		question_id: number;
		answer_id: number;
		score: number;
		is_accepted: boolean;
		title: string;
		link: string;
	}>;
};

export type WakatimePayload = {
	range: string;
	total_human: string;
	daily_average_human: string;
	languages: Array<{ name: string; percent: number; text: string }>;
	editors: Array<{ name: string; percent: number }>;
	url: string;
};

export type LeetcodePayload = {
	username: string;
	url: string;
	ranking: number | null;
	solved: { all: number; easy: number; medium: number; hard: number };
	totals: { all: number; easy: number; medium: number; hard: number };
};

export type NpmPayload = {
	username: string;
	url: string;
	packages: Array<{
		name: string;
		description: string;
		version: string;
		url: string;
		weekly_downloads: number | null;
	}>;
	total_weekly_downloads: number;
};

export type BlueskyPayload = {
	profile: {
		handle: string;
		display_name: string;
		avatar: string | null;
		followers: number;
		follows: number;
		posts: number;
		url: string;
	};
	posts: Array<{
		text: string;
		url: string;
		created_at: string;
		likes: number;
		reposts: number;
		replies: number;
	}>;
};

export type MastodonPayload = {
	profile: {
		acct: string;
		display_name: string;
		avatar: string | null;
		followers: number;
		following: number;
		statuses: number;
		url: string;
	};
	posts: Array<{
		text: string;
		url: string;
		created_at: string;
		favourites: number;
		reblogs: number;
	}>;
};

export type DockerhubPayload = {
	username: string;
	url: string;
	repos: Array<{
		name: string;
		namespace: string;
		description: string;
		pulls: number;
		stars: number;
		url: string;
		updated_at: string;
	}>;
	total_pulls: number;
};

export type YoutubePayload = {
	channel: { title: string; url: string };
	videos: Array<{
		title: string;
		url: string;
		thumbnail: string | null;
		published_at: string;
		description: string;
	}>;
};
