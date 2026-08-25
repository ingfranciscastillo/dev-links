import { z } from "zod";

export const linkSchema = z.object({
	id: z.string(),
	title: z.string().min(1, "Title is required").max(60),
	url: z.string().url("Must be a valid URL"),
	description: z.string().max(120).optional().or(z.literal("")),
	active: z.boolean(),
});
export type LinkItem = z.infer<typeof linkSchema>;

export const projectSchema = z.object({
	id: z.string(),
	name: z.string().min(1).max(60),
	description: z.string().max(200),
	tech: z.array(z.string()).max(12),
	github: z.string().url().optional().or(z.literal("")),
	demo: z.string().url().optional().or(z.literal("")),
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
	url: z.string().url(),
	source: z.string().max(40).optional().or(z.literal("")),
	date: z.string(), // ISO
});
export type ArticleItem = z.infer<typeof articleSchema>;

import { defaultThemeV2, type ThemeV2 } from "./theme-config";

export type ThemeConfig = ThemeV2;
export const defaultTheme: ThemeV2 = defaultThemeV2;

export type ProfileData = {
	links: LinkItem[];
	projects: ProjectItem[];
	snippets: SnippetItem[];
	articles: ArticleItem[];
	theme: ThemeV2;
	templateId: string | null;
};

export const emptyProfileData: ProfileData = {
	links: [],
	projects: [],
	snippets: [],
	articles: [],
	theme: defaultTheme,
	templateId: null,
};
