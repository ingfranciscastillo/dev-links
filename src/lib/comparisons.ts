// Contenido de las páginas /compare/$slug — comparativas honestas, no copy
// de ventas agresiva. Cifras de precio de la competencia se evitan a
// propósito (cambian y no las controlamos); todo lo que se afirma de
// DevLinks debe seguir siendo cierto según plan-limits.ts y las features
// reales del producto.
export interface ComparisonRow {
	label: string;
	devlinks: string;
	competitor: string;
}

export interface Comparison {
	slug: string;
	competitor: string;
	headline: string;
	/** Long-form, for the on-page intro paragraph. */
	intro: string;
	/** Short-form, ~150-160 chars — for <meta name="description"> and og:description. */
	metaDescription: string;
	rows: ComparisonRow[];
	whenTheyFit: string;
	whenDevlinksFits: string;
}

export const COMPARISONS: Comparison[] = [
	{
		slug: "linktree",
		competitor: "Linktree",
		headline: "DevLinks vs. Linktree",
		intro:
			"Linktree is built for creators managing a handful of manual links. DevLinks is built for developers whose proof of work already lives on GitHub, Dev.to, and Stack Overflow — and syncs it instead of asking you to re-enter it.",
		metaDescription:
			"See how DevLinks compares to Linktree for developers — GitHub sync, code snippets, and a developer directory Linktree doesn't have.",
		rows: [
			{
				label: "GitHub sync",
				devlinks: "Automatic — repos, contributions, pinned projects",
				competitor: "—",
			},
			{
				label: "Code snippets",
				devlinks: "Syntax-highlighted, built in",
				competitor: "—",
			},
			{
				label: "Writing platforms",
				devlinks: "Dev.to and Medium auto-imported",
				competitor: "Manual link only",
			},
			{
				label: "Developer directory",
				devlinks: "Opt-in, searchable by stack and seniority",
				competitor: "—",
			},
			{
				label: "Analytics",
				devlinks: "First-party, cookieless (Pro)",
				competitor: "Available on paid tiers",
			},
			{
				label: "Pricing",
				devlinks: "Free forever, $5/mo Pro",
				competitor: "Free tier limited, paid tiers for advanced features",
			},
		],
		whenTheyFit:
			"If you're posting links across unrelated projects with no code or dev-platform component — a musician or a shop, say — Linktree's simplicity wins.",
		whenDevlinksFits:
			"If most of what you'd link to already lives on GitHub, Dev.to, or Stack Overflow, DevLinks keeps it current without extra work.",
	},
	{
		slug: "bento",
		competitor: "Bento",
		headline: "DevLinks vs. Bento",
		intro:
			"Bento is a flexible, visual link-in-bio grid — but every block is filled in by hand. DevLinks fills the equivalent blocks automatically from the developer platforms you already use.",
		metaDescription:
			"See how DevLinks compares to Bento for developers — automatic GitHub sync vs. a fully manual link grid.",
		rows: [
			{
				label: "GitHub sync",
				devlinks: "Automatic — repos, contributions, pinned projects",
				competitor: "—",
			},
			{
				label: "Code snippets",
				devlinks: "Syntax-highlighted, built in",
				competitor: "—",
			},
			{
				label: "Grid/visual customization",
				devlinks: "Theme builder + custom CSS (Pro)",
				competitor: "Highly customizable, fully manual layout",
			},
			{
				label: "Developer directory",
				devlinks: "Opt-in, searchable by stack and seniority",
				competitor: "—",
			},
			{
				label: "Maintenance",
				devlinks: "Updates itself in the background",
				competitor: "Updated by hand, block by block",
			},
			{
				label: "Pricing",
				devlinks: "Free forever, $5/mo Pro",
				competitor: "Free tier limited, paid tiers for advanced features",
			},
		],
		whenTheyFit:
			"If visual grid customization matters more to you than automatic sync, and you don't mind updating blocks by hand, Bento's flexibility is real.",
		whenDevlinksFits:
			"If you'd rather your page update itself when you ship something new, DevLinks does that by design.",
	},
	{
		slug: "github-readme",
		competitor: "a GitHub README or DIY portfolio",
		headline: "DevLinks vs. a GitHub README (or building it yourself)",
		intro:
			"A GitHub profile README is free and already where developers live — but it's GitHub-only, limited to markdown, and just as easy to leave stale as any portfolio site you meant to keep updating.",
		metaDescription:
			"See how DevLinks compares to a GitHub README or DIY portfolio — writing, Stack Overflow, and code snippets in one auto-synced profile.",
		rows: [
			{
				label: "Beyond GitHub",
				devlinks: "Dev.to, Medium, Stack Overflow, LeetCode and more",
				competitor: "GitHub only",
			},
			{
				label: "A single shareable URL",
				devlinks: "devlinks.com/you",
				competitor: "Lives inside github.com/username, or a domain you buy and host",
			},
			{
				label: "Design control",
				devlinks: "Theme builder, no code required",
				competitor: "Markdown and hand-written badges, or a full custom build",
			},
			{
				label: "Maintenance",
				devlinks: "Auto-synced in the background",
				competitor: "As current as your last manual edit or deploy",
			},
			{
				label: "Cost",
				devlinks: "Free",
				competitor: "Free to build, but costs your time to build and maintain",
			},
		],
		whenTheyFit:
			"If GitHub is truly the only place you want to be found, and you don't mind markdown, the README is genuinely free and sufficient.",
		whenDevlinksFits:
			"If you want writing, Stack Overflow, and code snippets living next to your repos — without hand-maintaining any of it — that's the gap DevLinks fills.",
	},
];

export function getComparison(slug: string): Comparison | undefined {
	return COMPARISONS.find((c) => c.slug === slug);
}
