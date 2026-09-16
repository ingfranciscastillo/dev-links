// Metadata lives here as a typed array (same pattern as comparisons.ts and
// integrations/seo-content.ts) instead of parsed MDX frontmatter — for a
// handful of posts a year, a plain array is simpler than adding a
// remark-frontmatter pipeline just to avoid typing a title twice.
export interface BlogPostMeta {
	slug: string;
	title: string;
	description: string;
	date: string; // ISO date, e.g. "2026-09-16"
	pillar: "github-profile" | "job-search" | "building-in-public";
	load: () => Promise<{ default: React.ComponentType }>;
}

export const BLOG_POSTS: BlogPostMeta[] = [
	{
		slug: "why-i-built-devlinks",
		title: "Why I built a link-in-bio just for developers",
		description:
			"Generic link-in-bio tools treat a GitHub profile like a Spotify playlist. DevLinks starts from GitHub instead of a blank page.",
		date: "2026-09-16",
		pillar: "building-in-public",
		load: () => import("./why-i-built-devlinks.mdx"),
	},
];

export function getBlogPost(slug: string): BlogPostMeta | undefined {
	return BLOG_POSTS.find((p) => p.slug === slug);
}
