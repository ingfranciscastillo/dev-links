import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { BatchItem } from "drizzle-orm/batch";
import { z } from "zod";
import { user as authUser } from "@/db/auth-schema";
import { db } from "@/db/index";
import {
	articles,
	links,
	profiles,
	projects,
	snippets,
	supportLinks,
	talks,
	themes,
} from "@/db/schema";
import { authMiddleware } from "@/lib/auth-middleware";
import { limitsFor } from "@/lib/plan-limits";
import { defaultTheme, type ProfileData } from "@/lib/schemas";
import {
	SOCIAL_PLATFORM_KEYS,
	type SocialLinks,
	sanitizeSocialLinks,
} from "@/lib/social-links";
import {
	parseThemeConfig,
	type ThemeV2,
	themeV2Schema,
} from "@/lib/theme-config";
import { templateById } from "@/lib/theme-templates";

async function getPlanLimits(userId: string) {
	const [row] = await db
		.select({ plan: profiles.plan })
		.from(profiles)
		.where(eq(profiles.id, userId))
		.limit(1);
	return limitsFor(row?.plan);
}

// Authoritative server-side scheme allow-list for every URL a visitor can
// click on a public profile — the sole gate, since this file's validators
// (not the client-only ones in schemas.ts) are the actual trust boundary.
// zod's own .url()/z.url() only checks syntax, not scheme, so it would still
// accept "javascript:..." — this refine is what actually blocks it.
const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
function isSafeUrl(value: string): boolean {
	try {
		return SAFE_URL_SCHEMES.has(new URL(value).protocol);
	} catch {
		return false;
	}
}
const URL_SCHEME_MESSAGE = "Enter a full link, like https://example.com";
const requiredUrl = z.string().min(1).refine(isSafeUrl, URL_SCHEME_MESSAGE);
const optionalUrl = z
	.string()
	.refine((v) => v === "" || isSafeUrl(v), URL_SCHEME_MESSAGE)
	.optional();
const nullableOptionalUrl = z
	.string()
	.refine((v) => v === "" || isSafeUrl(v), URL_SCHEME_MESSAGE)
	.nullable()
	.optional();

// db.transaction no existe en el driver neon-http; los writes multi-statement
// van por db.batch (endpoint batch de Neon: un roundtrip, atómico).
type Batch = [BatchItem<"pg">, ...Array<BatchItem<"pg">>];

function isUniqueViolation(err: unknown): boolean {
	const code = (err as { code?: string } | null)?.code;
	if (code === "23505") return true;
	return (
		err instanceof Error &&
		/duplicate key value|unique constraint/i.test(err.message)
	);
}

// La tabla themes exige columnas legadas NOT NULL que el tema V2 ya no usa;
// se rellenan con equivalentes derivados del config real.
const LEGACY_BUTTON_STYLE = {
	solid: "solid",
	outline: "outline",
	ghost: "ghost",
	gradient: "solid",
	glass: "solid",
} as const;

function themeLegacyCols(config: ThemeV2) {
	return {
		accent: config.accent,
		background: "dark" as const,
		radius: "soft" as const,
		buttonStyle: LEGACY_BUTTON_STYLE[config.buttonStyle],
	};
}

async function upsertTheme(
	userId: string,
	config: ThemeV2,
	template: string | null,
) {
	const legacy = themeLegacyCols(config);
	await db
		.insert(themes)
		.values({ userId, ...legacy, config, template })
		.onConflictDoUpdate({
			target: themes.userId,
			set: { ...legacy, config, template, updatedAt: new Date() },
		});
}

// ---------- read (bundle completo, como el fetchAll viejo) ----------

export const getMyProfileData = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }): Promise<ProfileData> => {
		const { userId } = context;

		const [
			linkRows,
			projectRows,
			snippetRows,
			articleRows,
			talkRows,
			supportLinkRows,
			themeRow,
		] = await Promise.all([
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
			db
				.select()
				.from(talks)
				.where(eq(talks.userId, userId))
				.orderBy(desc(talks.date)),
			db
				.select()
				.from(supportLinks)
				.where(eq(supportLinks.userId, userId))
				.orderBy(asc(supportLinks.position)),
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
			talks: talkRows.map((r) => ({
				id: r.id,
				title: r.title,
				event: r.event,
				description: r.description,
				date: r.date,
				slidesUrl: r.slidesUrl,
				videoUrl: r.videoUrl,
			})),
			supportLinks: supportLinkRows.map((r) => ({
				id: r.id,
				category: r.category,
				platform: r.platform,
				label: r.label,
				url: r.url,
				serverId: r.serverId,
			})),
			theme: parseThemeConfig(themeRow[0]?.config),
			templateId: themeRow[0]?.template ?? null,
		};
	});

// Datos "core" del perfil que no viven en la sesión (bio/location/website)
// más los campos de discovery que consume el dashboard.
export type ProfileCore = {
	bio: string;
	website: string;
	calendarLink: string;
	socialLinks: SocialLinks;
	available: boolean;
	discoverable: boolean;
	country: string;
	primaryLanguage: string;
	seniority: string;
	technologies: string[];
	plan: string;
};

export const getMyProfileCore = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }): Promise<ProfileCore> => {
		const { userId } = context;
		const [row] = await db
			.select({
				bio: profiles.bio,
				website: profiles.website,
				calendarLink: profiles.calendarLink,
				socialLinks: profiles.socialLinks,
				available: profiles.available,
				discoverable: profiles.discoverable,
				country: profiles.country,
				primaryLanguage: profiles.primaryLanguage,
				seniority: profiles.seniority,
				technologies: profiles.technologies,
				plan: profiles.plan,
			})
			.from(profiles)
			.where(eq(profiles.id, userId))
			.limit(1);
		return {
			bio: row?.bio ?? "",
			website: row?.website ?? "",
			calendarLink: row?.calendarLink ?? "",
			socialLinks: row?.socialLinks ?? {},
			available: row?.available ?? false,
			discoverable: row?.discoverable ?? false,
			country: row?.country ?? "",
			primaryLanguage: row?.primaryLanguage ?? "",
			seniority: row?.seniority ?? "",
			technologies: row?.technologies ?? [],
			plan: row?.plan ?? "free",
		};
	});

const idInput = z.object({ id: z.string() });

// ---------- profile (user + profiles core fields) ----------

export const BIO_MAX_LENGTH = 160;

// Username libre pegado por el usuario ("@handle", URL completa, con
// espacios) — sanitizeSocialLinks se encarga de limpiarlo antes de guardar.
const socialUsername = z.string().trim().max(80).optional().or(z.literal(""));

const socialLinksInput = z
	.object(
		Object.fromEntries(
			SOCIAL_PLATFORM_KEYS.map((key) => [key, socialUsername]),
		) as Record<(typeof SOCIAL_PLATFORM_KEYS)[number], typeof socialUsername>,
	)
	.partial()
	.default({});

export const profileInput = z.object({
	name: z.string().min(2).max(60),
	username: z
		.string()
		.min(3)
		.max(24)
		.regex(/^[a-z0-9_-]+$/, "Only a-z, 0-9, _ and -"),
	bio: z.string().max(BIO_MAX_LENGTH).optional().or(z.literal("")),
	website: optionalUrl,
	calendarLink: optionalUrl,
	socialLinks: socialLinksInput,
});

export const upsertMyProfile = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => profileInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const cleanUsername = data.username.toLowerCase();

		try {
			// db.batch: las statements viajan en una sola petición y Neon las
			// ejecuta atómicamente (db.transaction no existe en neon-http).
			await db.batch([
				db
					.update(authUser)
					.set({
						name: data.name,
						username: cleanUsername,
						updatedAt: new Date(),
					})
					.where(eq(authUser.id, userId)),
				db
					.insert(profiles)
					.values({
						id: userId,
						bio: data.bio || null,
						website: data.website || null,
						calendarLink: data.calendarLink || null,
						socialLinks: sanitizeSocialLinks(data.socialLinks),
					})
					.onConflictDoUpdate({
						target: profiles.id,
						set: {
							bio: data.bio || null,
							website: data.website || null,
							calendarLink: data.calendarLink || null,
							socialLinks: sanitizeSocialLinks(data.socialLinks),
							updatedAt: new Date(),
						},
					}),
			]);
		} catch (err) {
			if (isUniqueViolation(err)) {
				throw new Error("That username is taken");
			}
			throw err;
		}

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
	discoverable: z.boolean().default(false),
});

export const updateDiscovery = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => discoveryInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const values = {
			country: data.country || null,
			primaryLanguage: data.primaryLanguage || null,
			seniority: data.seniority || null,
			technologies: data.technologies,
			available: data.available,
			discoverable: data.discoverable,
		};
		// Upsert: la fila profiles puede no existir aún si el usuario nunca
		// guardó el perfil core — un UPDATE plano sería un no-op silencioso.
		await db
			.insert(profiles)
			.values({ id: userId, ...values })
			.onConflictDoUpdate({
				target: profiles.id,
				set: { ...values, updatedAt: new Date() },
			});
		return { ok: true as const };
	});

// ---------- links ----------

const linkInput = z.object({
	title: z.string().min(1),
	url: requiredUrl,
	description: z.string().optional(),
});

export const addLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => linkInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const limits = await getPlanLimits(userId);

		// Single guarded INSERT...SELECT...WHERE instead of a separate
		// count-then-insert: collapses the two round trips (and the window a
		// concurrent request could land in between them) into one statement,
		// same idea as the atomic position subquery below.
		const limitGuard = Number.isFinite(limits.links)
			? sql`(select count(*)::int from ${links} where ${links.userId} = ${userId}) < ${limits.links}`
			: sql`true`;
		const [row] = await db
			.insert(links)
			.select(sql`
				select
					gen_random_uuid(),
					${userId}::text,
					${data.title}::text,
					${data.url}::text,
					${data.description || null}::text,
					true,
					(select count(*)::int from ${links} where ${links.userId} = ${userId}),
					now()
				where ${limitGuard}
			`)
			.returning();

		if (!row) {
			throw new Error(
				`Free plan is limited to ${limits.links} links. Upgrade to Pro for unlimited.`,
			);
		}
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
	url: optionalUrl,
	description: z.string().nullable().optional(),
	active: z.boolean().optional(),
});

export const updateLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => updateLinkInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const { id, ...patch } = data;
		await db
			.update(links)
			.set(patch)
			.where(and(eq(links.id, id), eq(links.userId, userId)));
	});

export const removeLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		await db
			.delete(links)
			.where(and(eq(links.id, data.id), eq(links.userId, userId)));
	});

const reorderInput = z.object({ ids: z.array(z.string()) });

export const reorderLinks = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => reorderInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		if (data.ids.length === 0) return;
		// Batch atómico: un roundtrip, todo-o-nada en Neon.
		const statements: Array<BatchItem<"pg">> = [];
		for (const [position, id] of data.ids.entries()) {
			statements.push(
				db
					.update(links)
					.set({ position })
					.where(and(eq(links.id, id), eq(links.userId, userId))),
			);
		}
		await db.batch(statements as Batch);
	});

export const toggleLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		await db
			.update(links)
			.set({ active: sql`NOT ${links.active}` })
			.where(and(eq(links.id, data.id), eq(links.userId, userId)));
	});

// ---------- projects ----------

const projectInput = z.object({
	name: z.string().min(1),
	description: z.string().default(""),
	tech: z.array(z.string()).default([]),
	github: optionalUrl,
	demo: optionalUrl,
	status: z.enum(["shipped", "wip", "archived"]).default("shipped"),
});

export const addProject = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => projectInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const limits = await getPlanLimits(userId);

		// See addLink: single guarded INSERT...SELECT...WHERE instead of
		// count-then-insert, closing the concurrent-request race window.
		const limitGuard = Number.isFinite(limits.projects)
			? sql`(select count(*)::int from ${projects} where ${projects.userId} = ${userId}) < ${limits.projects}`
			: sql`true`;
		// Built as array[$1, $2, ...] with each element its own bound
		// parameter, not a single ::text[]-cast param — the raw driver isn't
		// guaranteed to serialize a JS array value into Postgres array
		// wire format on its own.
		const techArray =
			data.tech.length > 0
				? sql`array[${sql.join(
						data.tech.map((t) => sql`${t}::text`),
						sql`, `,
					)}]`
				: sql`array[]::text[]`;
		const [row] = await db
			.insert(projects)
			.select(sql`
				select
					gen_random_uuid(),
					${userId}::text,
					${data.name}::text,
					${data.description}::text,
					${techArray},
					${data.github || null}::text,
					${data.demo || null}::text,
					${data.status}::project_status,
					now()
				where ${limitGuard}
			`)
			.returning();

		if (!row) {
			throw new Error(
				`Free plan is limited to ${limits.projects} projects. Upgrade to Pro for unlimited.`,
			);
		}
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
	.middleware([authMiddleware])
	.validator((input) => updateProjectInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const { id, ...patch } = data;
		await db
			.update(projects)
			.set(patch)
			.where(and(eq(projects.id, id), eq(projects.userId, userId)));
	});

export const removeProject = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
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
	.middleware([authMiddleware])
	.validator((input) => snippetInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const limits = await getPlanLimits(userId);

		// See addLink: single guarded INSERT...SELECT...WHERE instead of
		// count-then-insert, closing the concurrent-request race window.
		const limitGuard = Number.isFinite(limits.snippets)
			? sql`(select count(*)::int from ${snippets} where ${snippets.userId} = ${userId}) < ${limits.snippets}`
			: sql`true`;
		const [row] = await db
			.insert(snippets)
			.select(sql`
				select
					gen_random_uuid(),
					${userId}::text,
					${data.title}::text,
					${data.language}::text,
					${data.code}::text,
					now()
				where ${limitGuard}
			`)
			.returning();

		if (!row) {
			throw new Error(
				`Free plan is limited to ${limits.snippets} snippets. Upgrade to Pro for unlimited.`,
			);
		}
		return {
			id: row.id,
			title: row.title,
			language: row.language,
			code: row.code,
		};
	});

const updateSnippetInput = snippetInput.partial().extend({ id: z.string() });

export const updateSnippet = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => updateSnippetInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const { id, ...patch } = data;
		await db
			.update(snippets)
			.set(patch)
			.where(and(eq(snippets.id, id), eq(snippets.userId, userId)));
	});

export const removeSnippet = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		await db
			.delete(snippets)
			.where(and(eq(snippets.id, data.id), eq(snippets.userId, userId)));
	});

// ---------- articles ----------

const articleInput = z.object({
	title: z.string().min(1),
	summary: z.string().optional(),
	url: requiredUrl,
	source: z.string().optional(),
	date: z.string(), // ISO
});

export const addArticle = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => articleInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
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
	url: optionalUrl,
	source: z.string().nullable().optional(),
	date: z.string().optional(),
});

export const updateArticle = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => updateArticleInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const { id, date, ...rest } = data;
		await db
			.update(articles)
			.set({ ...rest, ...(date ? { date: new Date(date) } : {}) })
			.where(and(eq(articles.id, id), eq(articles.userId, userId)));
	});

export const removeArticle = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		await db
			.delete(articles)
			.where(and(eq(articles.id, data.id), eq(articles.userId, userId)));
	});

// ---------- talks ----------

const talkInput = z.object({
	title: z.string().min(1),
	event: z.string().optional(),
	description: z.string().optional(),
	date: z.string().nullable().optional(),
	slidesUrl: nullableOptionalUrl,
	videoUrl: nullableOptionalUrl,
});

export const addTalk = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => talkInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const [row] = await db
			.insert(talks)
			.values({
				userId,
				title: data.title,
				event: data.event || "",
				description: data.description || "",
				date: data.date || null,
				slidesUrl: data.slidesUrl || null,
				videoUrl: data.videoUrl || null,
			})
			.returning();
		return {
			id: row.id,
			title: row.title,
			event: row.event,
			description: row.description,
			date: row.date,
			slidesUrl: row.slidesUrl,
			videoUrl: row.videoUrl,
		};
	});

const updateTalkInput = z.object({
	id: z.string(),
	title: z.string().optional(),
	event: z.string().optional(),
	description: z.string().optional(),
	date: z.string().nullable().optional(),
	slidesUrl: nullableOptionalUrl,
	videoUrl: nullableOptionalUrl,
});

export const updateTalk = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => updateTalkInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const { id, ...patch } = data;
		await db
			.update(talks)
			.set(patch)
			.where(and(eq(talks.id, id), eq(talks.userId, userId)));
	});

export const removeTalk = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		await db
			.delete(talks)
			.where(and(eq(talks.id, data.id), eq(talks.userId, userId)));
	});

// ---------- support links ----------

const supportLinkInput = z.object({
	category: z.enum(["support", "community"]),
	platform: z.string().min(1),
	label: z.string().optional(),
	url: requiredUrl,
	serverId: z.string().nullable().optional(),
});

export const addSupportLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => supportLinkInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const [row] = await db
			.insert(supportLinks)
			.values({
				userId,
				category: data.category,
				platform: data.platform,
				label: data.label || "",
				url: data.url,
				serverId: data.serverId || null,
				// Subquery atómico: evita la carrera count-then-insert.
				position: sql<number>`(SELECT COUNT(*)::int FROM ${supportLinks} WHERE ${supportLinks.userId} = ${userId})`,
			})
			.returning();
		return {
			id: row.id,
			category: row.category,
			platform: row.platform,
			label: row.label,
			url: row.url,
			serverId: row.serverId,
		};
	});

const updateSupportLinkInput = z.object({
	id: z.string(),
	category: z.enum(["support", "community"]).optional(),
	platform: z.string().optional(),
	label: z.string().optional(),
	url: optionalUrl,
	serverId: z.string().nullable().optional(),
});

export const updateSupportLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => updateSupportLinkInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const { id, ...patch } = data;
		await db
			.update(supportLinks)
			.set(patch)
			.where(and(eq(supportLinks.id, id), eq(supportLinks.userId, userId)));
	});

export const removeSupportLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		await db
			.delete(supportLinks)
			.where(
				and(eq(supportLinks.id, data.id), eq(supportLinks.userId, userId)),
			);
	});

// ---------- theme ----------

export const updateTheme = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => themeV2Schema.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const limits = await getPlanLimits(userId);
		if (!limits.customCss && data.customCss.trim()) {
			throw new Error(
				"Custom CSS is a Pro feature. Upgrade to Pro to enable it.",
			);
		}
		await upsertTheme(userId, data, null);
	});

const templateInput = z.object({ templateId: z.string() });

export const applyThemeTemplate = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => templateInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;
		const tpl = templateById(data.templateId);
		if (!tpl) return;
		await upsertTheme(userId, tpl.config, data.templateId);
	});

export const resetTheme = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const { userId } = context;
		await upsertTheme(userId, defaultTheme, null);
	});

// ---------- wipe ----------

const wipeInput = z.object({ username: z.string() });

export const wipeProfileData = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => wipeInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;

		// The dashboard UI only disables the wipe button until the typed
		// confirmation matches the username — that's client-side only and
		// never reached the server, so this irreversible bulk delete could
		// be triggered directly (e.g. via devtools) with no confirmation at
		// all. Re-validate the same check server-side.
		const [row] = await db
			.select({ username: authUser.username })
			.from(authUser)
			.where(eq(authUser.id, userId))
			.limit(1);
		if (!row || data.username !== row.username) {
			throw new Error("Confirmation username does not match.");
		}

		await db.batch([
			db.delete(links).where(eq(links.userId, userId)),
			db.delete(projects).where(eq(projects.userId, userId)),
			db.delete(snippets).where(eq(snippets.userId, userId)),
			db.delete(articles).where(eq(articles.userId, userId)),
		]);
	});
