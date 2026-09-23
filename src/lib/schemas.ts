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
const safeUrl = (message = "Enter a full link, like https://example.com") =>
	z.string().refine(isSafeUrl, message);

export const linkSchema = z.object({
	id: z.string(),
	title: z.string().min(1, "Title is required").max(60),
	url: safeUrl(),
	description: z.string().max(120).optional().or(z.literal("")),
	active: z.boolean(),
});
export type LinkItem = z.infer<typeof linkSchema>;

export const projectSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(60),
	description: z.string().max(200),
	tech: z.array(z.string()).max(12),
	github: safeUrl().optional().or(z.literal("")),
	demo: safeUrl().optional().or(z.literal("")),
	status: z.enum(["shipped", "wip", "archived"]),
});
export type ProjectItem = z.infer<typeof projectSchema>;

export const snippetSchema = z.object({
	id: z.string(),
	title: z.string().min(1).max(80),
	language: z.string().min(1).max(24),
	code: z.string().min(1).max(4000),
});
export type SnippetItem = z.infer<typeof snippetSchema>;

export const articleSchema = z.object({
	id: z.string(),
	title: z.string().min(1).max(160),
	summary: z.string().max(240).optional().or(z.literal("")),
	url: safeUrl(),
	source: z.string().max(40).optional().or(z.literal("")),
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
	title: z.string().min(1, "Title is required").max(160),
	event: z.string().max(120).optional().or(z.literal("")),
	description: z.string().max(400).optional().or(z.literal("")),
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
	label: z.string().max(60).optional().or(z.literal("")),
	url: safeUrl(),
	serverId: z.string().max(40).optional().or(z.literal("")).nullable(),
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
