import { z } from "zod";

// Mirrors the server-side allow-list in profile-data.functions.ts — client
// validation is UX only, but z.url()/.url() alone accepts "javascript:..."
// since it checks syntax, not scheme, so keep this in sync with the server.
const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
function isSafeUrl(value: string): boolean {
	try {
		return SAFE_URL_SCHEMES.has(new URL(value).protocol);
	} catch {
		return false;
	}
}
// Field limits shared by the dashboard forms (UX) and the server validators
// in profile-data.functions.ts (the actual trust boundary), so they can't
// drift apart. Snippets matter most: every public profile view syntax-
// highlights them, so an unbounded one makes each view slow and huge.
export const LIMITS = {
	url: 2048,
	linkTitle: 60,
	linkDescription: 120,
	projectName: 60,
	projectDescription: 200,
	projectTech: 12,
	techItem: 40,
	snippetTitle: 80,
	snippetLanguage: 24,
	snippetCode: 4000,
	articleTitle: 160,
	articleSummary: 240,
	articleSource: 40,
	talkTitle: 160,
	talkEvent: 120,
	talkDescription: 400,
	supportLabel: 60,
	serverId: 40,
} as const;

export const SUPPORT_PLATFORMS = [
	"buymeacoffee",
	"kofi",
	"ghsponsors",
	"patreon",
] as const;
export const COMMUNITY_PLATFORMS = ["discord", "slack"] as const;

const safeUrl = (message = "Enter a full link, like https://example.com") =>
	z.string().refine(isSafeUrl, message);

export const linkSchema = z.object({
	id: z.string(),
	title: z.string().min(1, "Title is required").max(LIMITS.linkTitle),
	url: safeUrl(),
	description: z
		.string()
		.max(LIMITS.linkDescription)
		.optional()
		.or(z.literal("")),
	active: z.boolean(),
});
export type LinkItem = z.infer<typeof linkSchema>;

export const projectSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(LIMITS.projectName),
	description: z.string().max(LIMITS.projectDescription),
	tech: z.array(z.string().max(LIMITS.techItem)).max(LIMITS.projectTech),
	github: safeUrl().optional().or(z.literal("")),
	demo: safeUrl().optional().or(z.literal("")),
	status: z.enum(["shipped", "wip", "archived"]),
});
export type ProjectItem = z.infer<typeof projectSchema>;

export const snippetSchema = z.object({
	id: z.string(),
	title: z.string().min(1).max(LIMITS.snippetTitle),
	language: z.string().min(1).max(LIMITS.snippetLanguage),
	code: z.string().min(1).max(LIMITS.snippetCode),
});
export type SnippetItem = z.infer<typeof snippetSchema>;

export const articleSchema = z.object({
	id: z.string(),
	title: z.string().min(1).max(LIMITS.articleTitle),
	summary: z.string().max(LIMITS.articleSummary).optional().or(z.literal("")),
	url: safeUrl(),
	source: z.string().max(LIMITS.articleSource).optional().or(z.literal("")),
	date: z.string(), // ISO
});
export type ArticleItem = z.infer<typeof articleSchema>;

import { defaultThemeV2, type ThemeV2 } from "./theme-config";

export type ThemeConfig = ThemeV2;
export const defaultTheme: ThemeV2 = defaultThemeV2;

export type TalkItem = {
	id: string;
	title: string;
	event: string;
	description: string;
	date: string | null;
	slidesUrl: string | null;
	videoUrl: string | null;
};

export const talkSchema = z.object({
	id: z.string(),
	title: z.string().min(1, "Title is required").max(LIMITS.talkTitle),
	event: z.string().max(LIMITS.talkEvent).optional().or(z.literal("")),
	description: z
		.string()
		.max(LIMITS.talkDescription)
		.optional()
		.or(z.literal("")),
	date: z.string().optional().or(z.literal("")).nullable(),
	slidesUrl: safeUrl().optional().or(z.literal("")).nullable(),
	videoUrl: safeUrl().optional().or(z.literal("")).nullable(),
});

export type SupportLinkItem = {
	id: string;
	category: string;
	platform: string;
	label: string;
	url: string;
	serverId: string | null;
};

export const supportLinkSchema = z.object({
	id: z.string(),
	category: z.enum(["support", "community"]),
	platform: z.string().min(1, "Choose a platform"),
	label: z.string().max(LIMITS.supportLabel).optional().or(z.literal("")),
	url: safeUrl(),
	serverId: z
		.string()
		.max(LIMITS.serverId)
		.optional()
		.or(z.literal(""))
		.nullable(),
});

export type ProfileData = {
	links: LinkItem[];
	projects: ProjectItem[];
	snippets: SnippetItem[];
	articles: ArticleItem[];
	talks: TalkItem[];
	supportLinks: SupportLinkItem[];
	theme: ThemeV2;
	templateId: string | null;
};

export const emptyProfileData: ProfileData = {
	links: [],
	projects: [],
	snippets: [],
	articles: [],
	talks: [],
	supportLinks: [],
	theme: defaultTheme,
	templateId: null,
};
