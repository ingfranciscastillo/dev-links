import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, not } from "drizzle-orm";
import { z } from "zod";
import { user as authUser } from "@/db/auth-schema";
import { db } from "@/db/index";
import {
	articles,
	links,
	profiles,
	projects,
	snippets,
	themes,
} from "@/db/schema";
import { ensureSession } from "@/lib/auth.functions";
import { defaultTheme, type ProfileData } from "@/lib/schemas";
import { parseThemeConfig, themeV2Schema } from "@/lib/theme-config";
import { templateById } from "@/lib/theme-templates";

// Todas las funciones de este archivo derivan el userId de la sesión,
// NUNCA del input del cliente — sustituye a lo que hacía RLS en Supabase.
async function requireUserId() {
	const session = await ensureSession();
	return session.user.id;
}

// ---------- read (bundle completo, como el fetchAll viejo) ----------

export const getMyProfileData = createServerFn({ method: "GET" }).handler(
	async (): Promise<ProfileData> => {
		const userId = await requireUserId();

		const [linkRows, projectRows, snippetRows, articleRows, themeRow] =
			await Promise.all([
				db
					.select()
					.from(links)
					.where(eq(links.userId, userId))
					.orderBy(asc(links.position)),
				db
					.select()
					.from(projects)
					.where(eq(projects.userId, userId))
					.orderBy(desc(projects.createdAt)),
				db
					.select()
					.from(snippets)
					.where(eq(snippets.userId, userId))
					.orderBy(desc(snippets.createdAt)),
				db
					.select()
					.from(articles)
					.where(eq(articles.userId, userId))
					.orderBy(desc(articles.date)),
				db.select().from(themes).where(eq(themes.userId, userId)).limit(1),
			]);

		return {
			links: linkRows.map((r) => ({
				id: r.id,
				title: r.title,
				url: r.url,
				description: r.description ?? "",
				active: r.active,
			})),
			projects: projectRows.map((r) => ({
				id: r.id,
				name: r.name,
				description: r.description,
				tech: r.tech ?? [],
				github: r.github ?? "",
				demo: r.demo ?? "",
				status: r.status,
			})),
			snippets: snippetRows.map((r) => ({
				id: r.id,
				title: r.title,
				language: r.language,
				code: r.code,
			})),
			articles: articleRows.map((r) => ({
				id: r.id,
				title: r.title,
				summary: r.summary ?? "",
				url: r.url,
				source: r.source ?? "",
				date: r.date.toISOString(),
			})),
			theme: parseThemeConfig(themeRow[0]?.config),
			templateId: themeRow[0]?.template ?? null,
		};
	},
);

// Datos "core" del perfil que no viven en la sesión (bio/location/website/available)
export type ProfileCore = {
	bio: string;
	location: string;
	website: string;
	available: boolean;
};

export const getMyProfileCore = createServerFn({ method: "GET" }).handler(
	async (): Promise<ProfileCore> => {
		const userId = await requireUserId();
		const [row] = await db
			.select({
				bio: profiles.bio,
				location: profiles.location,
				website: profiles.website,
				available: profiles.available,
			})
			.from(profiles)
			.where(eq(profiles.id, userId))
			.limit(1);
		return {
			bio: row?.bio ?? "",
			location: row?.location ?? "",
			website: row?.website ?? "",
			available: row?.available ?? false,
		};
	},
);

const idInput = z.object({ id: z.string() });

// ---------- profile (user + profiles core fields) ----------

export const profileInput = z.object({
	name: z.string().min(2).max(60),
	username: z
		.string()
		.min(3)
		.max(24)
		.regex(/^[a-z0-9_-]+$/, "Only a-z, 0-9, _ and -"),
	bio: z.string().max(160).optional().or(z.literal("")),
	location: z.string().max(60).optional().or(z.literal("")),
	website: z.string().url().optional().or(z.literal("")),
});

export const upsertMyProfile = createServerFn({ method: "POST" })
	.validator((input) => profileInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const cleanUsername = data.username.toLowerCase();

		// Check username uniqueness against other rows.
		const [taken] = await db
			.select({ id: authUser.id })
			.from(authUser)
			.where(
				and(eq(authUser.username, cleanUsername), not(eq(authUser.id, userId))),
			)
			.limit(1);
		if (taken) {
			throw new Error("That username is taken");
		}

		await db
			.update(authUser)
			.set({ name: data.name, username: cleanUsername, updatedAt: new Date() })
			.where(eq(authUser.id, userId));

		await db
			.insert(profiles)
			.values({
				id: userId,
				bio: data.bio || null,
				location: data.location || null,
				website: data.website || null,
			})
			.onConflictDoUpdate({
				target: profiles.id,
				set: {
					bio: data.bio || null,
					location: data.location || null,
					website: data.website || null,
					updatedAt: new Date(),
				},
			});

		return { ok: true as const };
	});

const discoveryInput = z.object({
	country: z
		.string()
		.length(2)
		.regex(/^[A-Z]+$/)
		.optional()
		.or(z.literal("")),
	primaryLanguage: z.string().max(40).optional().or(z.literal("")),
	seniority: z.string().max(40).optional().or(z.literal("")),
	technologies: z.array(z.string().min(1).max(40)).max(20).default([]),
	available: z.boolean().default(false),
});

export const updateDiscovery = createServerFn({ method: "POST" })
	.validator((input) => discoveryInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		await db
			.update(profiles)
			.set({
				country: data.country || null,
				primaryLanguage: data.primaryLanguage || null,
				seniority: data.seniority || null,
				technologies: data.technologies,
				available: data.available,
				updatedAt: new Date(),
			})
			.where(eq(profiles.id, userId));
		return { ok: true as const };
	});

// ---------- links ----------

const linkInput = z.object({
	title: z.string().min(1),
	url: z.string().min(1),
	description: z.string().optional(),
});

export const addLink = createServerFn({ method: "POST" })
	.validator((input) => linkInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const existing = await db
			.select({ id: links.id })
			.from(links)
			.where(eq(links.userId, userId));
		const [row] = await db
			.insert(links)
			.values({
				userId,
				title: data.title,
				url: data.url,
				description: data.description || null,
				active: true,
				position: existing.length,
			})
			.returning();
		return {
			id: row.id,
			title: row.title,
			url: row.url,
			description: row.description ?? "",
			active: row.active,
		};
	});

const updateLinkInput = z.object({
	id: z.string(),
	title: z.string().optional(),
	url: z.string().optional(),
	description: z.string().nullable().optional(),
	active: z.boolean().optional(),
});

export const updateLink = createServerFn({ method: "POST" })
	.validator((input) => updateLinkInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const { id, ...patch } = data;
		await db
			.update(links)
			.set(patch)
			.where(and(eq(links.id, id), eq(links.userId, userId)));
	});

export const removeLink = createServerFn({ method: "POST" })
	.validator((input) => idInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		await db
			.delete(links)
			.where(and(eq(links.id, data.id), eq(links.userId, userId)));
	});

const reorderInput = z.object({ ids: z.array(z.string()) });

export const reorderLinks = createServerFn({ method: "POST" })
	.validator((input) => reorderInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		await Promise.all(
			data.ids.map((id, position) =>
				db
					.update(links)
					.set({ position })
					.where(and(eq(links.id, id), eq(links.userId, userId))),
			),
		);
	});

export const toggleLink = createServerFn({ method: "POST" })
	.validator((input) => idInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const [row] = await db
			.select({ active: links.active })
			.from(links)
			.where(and(eq(links.id, data.id), eq(links.userId, userId)));
		if (!row) return;
		await db
			.update(links)
			.set({ active: !row.active })
			.where(and(eq(links.id, data.id), eq(links.userId, userId)));
	});

// ---------- projects ----------

const projectInput = z.object({
	name: z.string().min(1),
	description: z.string().default(""),
	tech: z.array(z.string()).default([]),
	github: z.string().optional(),
	demo: z.string().optional(),
	status: z.enum(["shipped", "wip", "archived"]).default("shipped"),
});

export const addProject = createServerFn({ method: "POST" })
	.validator((input) => projectInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const [row] = await db
			.insert(projects)
			.values({
				userId,
				name: data.name,
				description: data.description,
				tech: data.tech,
				github: data.github || null,
				demo: data.demo || null,
				status: data.status,
			})
			.returning();
		return {
			id: row.id,
			name: row.name,
			description: row.description,
			tech: row.tech ?? [],
			github: row.github ?? "",
			demo: row.demo ?? "",
			status: row.status,
		};
	});

const updateProjectInput = projectInput.partial().extend({ id: z.string() });

export const updateProject = createServerFn({ method: "POST" })
	.validator((input) => updateProjectInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const { id, ...patch } = data;
		await db
			.update(projects)
			.set(patch)
			.where(and(eq(projects.id, id), eq(projects.userId, userId)));
	});

export const removeProject = createServerFn({ method: "POST" })
	.validator((input) => idInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		await db
			.delete(projects)
			.where(and(eq(projects.id, data.id), eq(projects.userId, userId)));
	});

// ---------- snippets ----------

const snippetInput = z.object({
	title: z.string().min(1),
	language: z.string().default("ts"),
	code: z.string(),
});

export const addSnippet = createServerFn({ method: "POST" })
	.validator((input) => snippetInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const [row] = await db
			.insert(snippets)
			.values({ userId, ...data })
			.returning();
		return {
			id: row.id,
			title: row.title,
			language: row.language,
			code: row.code,
		};
	});

const updateSnippetInput = snippetInput.partial().extend({ id: z.string() });

export const updateSnippet = createServerFn({ method: "POST" })
	.validator((input) => updateSnippetInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const { id, ...patch } = data;
		await db
			.update(snippets)
			.set(patch)
			.where(and(eq(snippets.id, id), eq(snippets.userId, userId)));
	});

export const removeSnippet = createServerFn({ method: "POST" })
	.validator((input) => idInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		await db
			.delete(snippets)
			.where(and(eq(snippets.id, data.id), eq(snippets.userId, userId)));
	});

// ---------- articles ----------

const articleInput = z.object({
	title: z.string().min(1),
	summary: z.string().optional(),
	url: z.string().min(1),
	source: z.string().optional(),
	date: z.string(), // ISO
});

export const addArticle = createServerFn({ method: "POST" })
	.validator((input) => articleInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const [row] = await db
			.insert(articles)
			.values({
				userId,
				title: data.title,
				summary: data.summary || null,
				url: data.url,
				source: data.source || null,
				date: new Date(data.date),
			})
			.returning();
		return {
			id: row.id,
			title: row.title,
			summary: row.summary ?? "",
			url: row.url,
			source: row.source ?? "",
			date: row.date.toISOString(),
		};
	});

const updateArticleInput = z.object({
	id: z.string(),
	title: z.string().optional(),
	summary: z.string().nullable().optional(),
	url: z.string().optional(),
	source: z.string().nullable().optional(),
	date: z.string().optional(),
});

export const updateArticle = createServerFn({ method: "POST" })
	.validator((input) => updateArticleInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const { id, date, ...rest } = data;
		await db
			.update(articles)
			.set({ ...rest, ...(date ? { date: new Date(date) } : {}) })
			.where(and(eq(articles.id, id), eq(articles.userId, userId)));
	});

export const removeArticle = createServerFn({ method: "POST" })
	.validator((input) => idInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		await db
			.delete(articles)
			.where(and(eq(articles.id, data.id), eq(articles.userId, userId)));
	});

// ---------- theme ----------

export const updateTheme = createServerFn({ method: "POST" })
	.validator((input) => themeV2Schema.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		await db
			.update(themes)
			.set({ config: data, template: null })
			.where(eq(themes.userId, userId));
	});

const templateInput = z.object({ templateId: z.string() });

export const applyThemeTemplate = createServerFn({ method: "POST" })
	.validator((input) => templateInput.parse(input))
	.handler(async ({ data }) => {
		const userId = await requireUserId();
		const tpl = templateById(data.templateId);
		if (!tpl) return;
		await db
			.update(themes)
			.set({ config: tpl.config, template: data.templateId })
			.where(eq(themes.userId, userId));
	});

export const resetTheme = createServerFn({ method: "POST" }).handler(
	async () => {
		const userId = await requireUserId();
		await db
			.update(themes)
			.set({ config: defaultTheme, template: null })
			.where(eq(themes.userId, userId));
	},
);

// ---------- wipe ----------

export const wipeProfileData = createServerFn({ method: "POST" }).handler(
	async () => {
		const userId = await requireUserId();
		await Promise.all([
			db.delete(links).where(eq(links.userId, userId)),
			db.delete(projects).where(eq(projects.userId, userId)),
			db.delete(snippets).where(eq(snippets.userId, userId)),
			db.delete(articles).where(eq(articles.userId, userId)),
		]);
	},
);
