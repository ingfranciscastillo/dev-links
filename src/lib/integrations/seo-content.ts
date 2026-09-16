import type { Provider } from "./types";

// Contenido de las páginas /integrations/$provider. "syncs" describe campos
// reales tal como los devuelve cada *.server.ts / types.ts — nada aspiracional.
export interface IntegrationSeoContent {
	tagline: string;
	description: string;
	syncs: string[];
}

export const INTEGRATION_SEO: Partial<Record<Provider, IntegrationSeoContent>> =
	{
		github: {
			tagline: "Your commits, contributions, and pinned repos — always current.",
			description:
				"Connect GitHub and your profile reflects what you actually shipped, refreshed automatically instead of re-typed by hand.",
			syncs: [
				"Public repos with stars, forks, and language",
				"Pinned repositories",
				"Contribution heatmap",
				"Top languages across your work",
			],
		},
		gitlab: {
			tagline: "Public GitLab projects on your DevLinks profile.",
			description:
				"For work that lives on GitLab instead of (or alongside) GitHub, sync your public projects the same way.",
			syncs: [
				"Public projects with stars and forks",
				"Profile bio and avatar",
				"Total stars and project count",
			],
		},
		devto: {
			tagline: "Your Dev.to articles, kept up to date.",
			description:
				"Every article you publish on Dev.to shows up on your DevLinks profile without you posting it twice.",
			syncs: [
				"Published articles with reactions and read time",
				"Cover images and tags",
				"Refreshed automatically in the background",
			],
		},
		medium: {
			tagline: "Your Medium posts, pulled in automatically.",
			description:
				"DevLinks reads your public Medium RSS feed so new posts appear on your profile without any manual step.",
			syncs: ["Latest posts via your public RSS feed", "Cover images and publish dates"],
		},
		stackoverflow: {
			tagline: "Reputation and top answers, front and center.",
			description:
				"If you've built reputation helping other developers, your Stack Overflow profile is proof of work worth showing.",
			syncs: [
				"Reputation and badge counts (gold / silver / bronze)",
				"Top answers with scores",
				"Accepted-answer status",
			],
		},
		wakatime: {
			tagline: "How you actually spend your coding time.",
			description:
				"WakaTime tracks time by language and editor — DevLinks surfaces it as real, ongoing proof of active work.",
			syncs: [
				"Coding time by language for your selected range",
				"Daily average and top editors",
				"Link to your public WakaTime profile",
			],
		},
		leetcode: {
			tagline: "Problems solved, ranking included.",
			description:
				"Show interview prep or algorithmic practice as a living stat, not a line on a resume.",
			syncs: [
				"Problems solved by difficulty (easy / medium / hard)",
				"Global ranking",
				"Link to your LeetCode profile",
			],
		},
		npm: {
			tagline: "Packages you maintain, with real download numbers.",
			description:
				"If you publish to npm, your download counts are a stronger signal than any bullet point on a resume.",
			syncs: [
				"Published packages with current version",
				"Weekly download counts per package",
				"Total weekly downloads",
			],
		},
		bluesky: {
			tagline: "Your Bluesky presence, without a separate link.",
			description:
				"Bring your public Bluesky activity into the same page as your code and writing.",
			syncs: [
				"Follower, following, and post counts",
				"Recent posts with likes, reposts, and replies",
			],
		},
		mastodon: {
			tagline: "Your Mastodon feed, wherever your instance lives.",
			description:
				"Works with any Mastodon instance — your public posts and stats sync the same way.",
			syncs: [
				"Followers and status count from your instance",
				"Recent posts with favourites and reblogs",
			],
		},
		dockerhub: {
			tagline: "Docker images you publish, with pull counts.",
			description:
				"If you ship containers, your Docker Hub pulls are proof people actually use what you build.",
			syncs: ["Public repos with pull counts", "Total pulls across all images"],
		},
		youtube: {
			tagline: "Your latest videos, embedded automatically.",
			description:
				"For developers who teach or build in public on YouTube, recent uploads show up without manual embedding.",
			syncs: ["Channel link", "Recent videos with thumbnails and descriptions"],
		},
		huggingface: {
			tagline: "Models, datasets, and Spaces you've published.",
			description:
				"For ML/AI work, Hugging Face activity is often the most relevant proof of work you have — DevLinks surfaces it directly.",
			syncs: [
				"Models, datasets, and Spaces counts",
				"Top models with likes and downloads",
				"Pro badge, if applicable",
			],
		},
		producthunt: {
			tagline: "Products you've launched, with real traction.",
			description:
				"If you've shipped something and launched it on Product Hunt, that's a stronger signal than a portfolio screenshot.",
			syncs: [
				"Launched products with votes and comments",
				"Follower count",
				"Product thumbnails",
			],
		},
		dribbble: {
			tagline: "For developers who also design.",
			description:
				"If part of your work is visual — UI, product design, illustration — your Dribbble shots belong next to your code.",
			syncs: ["Shots with likes and views", "Follower count", "Bio and avatar"],
		},
	};

export function getIntegrationSeo(
	provider: Provider,
): IntegrationSeoContent | undefined {
	return INTEGRATION_SEO[provider];
}

// Pinterest existe en el modelo de datos pero su OAuth queda en pausa hasta
// tener dominio propio (verificación de dominio de la API de Pinterest) —
// se excluye de las páginas públicas de /integrations hasta que esté live.
export const SEO_PROVIDERS = Object.keys(INTEGRATION_SEO) as Provider[];
