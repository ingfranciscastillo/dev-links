export type Provider =
	| "github"
	| "devto"
	| "hashnode"
	| "medium"
	| "stackoverflow";

export const PROVIDERS: Provider[] = [
	"github",
	"devto",
	"hashnode",
	"medium",
	"stackoverflow",
];

export const PROVIDER_LABEL: Record<Provider, string> = {
	github: "GitHub",
	devto: "Dev.to",
	hashnode: "Hashnode",
	medium: "Medium",
	stackoverflow: "Stack Overflow",
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

export type HashnodePayload = {
	posts: Array<{
		title: string;
		brief: string;
		url: string;
		cover_image: string | null;
		reactions: number;
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
