export type Provider =
	| "github"
	| "gitlab"
	| "devto"
	| "medium"
	| "stackoverflow"
	| "wakatime"
	| "leetcode"
	| "npm"
	| "bluesky"
	| "mastodon"
	| "dockerhub"
	| "youtube"
	| "huggingface"
	| "producthunt"
	| "dribbble";

export const PROVIDERS: Provider[] = [
	"github",
	"gitlab",
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
	"huggingface",
	"producthunt",
	"dribbble",
];

export const PROVIDER_LABEL: Record<Provider, string> = {
	github: "GitHub",
	gitlab: "GitLab",
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
	huggingface: "Hugging Face",
	producthunt: "Product Hunt",
	dribbble: "Dribbble",
};

export type ProviderSegment =
	| "designer"
	| "developer"
	| "builder"
	| "social"
	| "professional";

export const PROVIDER_SEGMENTS: ProviderSegment[] = [
	"designer",
	"developer",
	"builder",
	"social",
	"professional",
];

export const PROVIDER_SEGMENT: Record<Provider, ProviderSegment> = {
	github: "developer",
	gitlab: "developer",
	stackoverflow: "developer",
	wakatime: "developer",
	leetcode: "developer",
	npm: "developer",
	dockerhub: "developer",
	huggingface: "developer",
	devto: "builder",
	medium: "builder",
	youtube: "builder",
	producthunt: "builder",
	bluesky: "social",
	mastodon: "social",
	dribbble: "designer",
};

export const SEGMENT_LABEL: Record<ProviderSegment, string> = {
	designer: "Designer",
	social: "Social",
	developer: "Developer",
	builder: "Builder",
	professional: "Professional",
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

export type HuggingfacePayload = {
	profile: {
		username: string;
		fullname: string | null;
		avatar_url: string | null;
		bio: string | null;
		is_pro: boolean;
		followers: number;
		models_count: number;
		datasets_count: number;
		spaces_count: number;
		likes: number;
		url: string;
	};
	models: Array<{
		id: string;
		name: string;
		likes: number;
		downloads: number;
		pipeline_tag: string | null;
		url: string;
	}>;
};

export type ProductHuntPayload = {
	profile: {
		username: string;
		name: string;
		headline: string | null;
		avatar_url: string | null;
		followers: number;
		url: string;
	};
	posts: Array<{
		id: string;
		name: string;
		tagline: string;
		url: string;
		votes: number;
		comments: number;
		thumbnail: string | null;
		created_at: string;
	}>;
};

export type DribbblePayload = {
	profile: {
		username: string;
		name: string | null;
		avatar_url: string | null;
		bio: string | null;
		followers: number;
		url: string;
	};
	shots: Array<{
		id: number;
		title: string;
		description: string | null;
		image: string | null;
		url: string;
		likes: number;
		views: number;
		published_at: string | null;
	}>;
};

export type GitlabPayload = {
	profile: {
		username: string;
		name: string | null;
		bio: string | null;
		avatar_url: string | null;
		url: string;
	};
	repos: Array<{
		name: string;
		full_name: string;
		description: string;
		stars: number;
		forks: number;
		url: string;
		updated_at: string;
	}>;
	totals: { stars: number; projects: number };
};
