// Input validators for profile-data.functions.ts, the server-side trust
// boundary for everything a user writes to their profile. Kept in their own
// module (no db/auth imports) so they can be unit tested.

import { z } from "zod";
import { COMMUNITY_PLATFORMS, LIMITS, SUPPORT_PLATFORMS } from "@/lib/schemas";
import { SOCIAL_PLATFORM_KEYS } from "@/lib/social-links";

// Authoritative server-side scheme allow-list for every URL a visitor can
// click on a public profile — the sole gate, since this file's validators
// (not the client-only ones in schemas.ts) are the actual trust boundary.
// zod's own .url()/z.url() only checks syntax, not scheme, so it would still
// accept "javascript:..." — this refine is what actually blocks it.
export const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
export function isSafeUrl(value: string): boolean {
	try {
		return SAFE_URL_SCHEMES.has(new URL(value).protocol);
	} catch {
		return false;
	}
}
export const URL_SCHEME_MESSAGE = "Enter a full link, like https://example.com";
export const requiredUrl = z
	.string()
	.min(1)
	.max(LIMITS.url)
	.refine(isSafeUrl, URL_SCHEME_MESSAGE);
export const optionalUrl = z
	.string()
	.max(LIMITS.url)
	.refine((v) => v === "" || isSafeUrl(v), URL_SCHEME_MESSAGE)
	.optional();
export const nullableOptionalUrl = z
	.string()
	.max(LIMITS.url)
	.refine((v) => v === "" || isSafeUrl(v), URL_SCHEME_MESSAGE)
	.nullable()
	.optional();

// Every limit below mirrors the dashboard form schemas (LIMITS in
// lib/schemas.ts): those are UX only, this file is the trust boundary.
export const rowId = z.uuid();
export const idInput = z.object({ id: rowId });

// Articles store a timestamp, talks a calendar date ("YYYY-MM-DD" column).
export const isoDateTime = z
	.string()
	.max(40)
	.refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");
export const calendarDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date")
	.refine((v) => !Number.isNaN(Date.parse(v)), "Invalid date");
export const optionalCalendarDate = calendarDate
	.or(z.literal(""))
	.nullable()
	.optional()
	.transform((v) => (v === "" ? null : v));
export const supportPlatform = z.enum([
	...SUPPORT_PLATFORMS,
	...COMMUNITY_PLATFORMS,
]);

export const BIO_MAX_LENGTH = 160;

// Username libre pegado por el usuario ("@handle", URL completa, con
// espacios) — sanitizeSocialLinks se encarga de limpiarlo antes de guardar.
export const socialUsername = z
	.string()
	.trim()
	.max(80)
	.optional()
	.or(z.literal(""));

export const socialLinksInput = z
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

export const discoveryInput = z.object({
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

export const linkInput = z.object({
	title: z.string().min(1).max(LIMITS.linkTitle),
	url: requiredUrl,
	description: z.string().max(LIMITS.linkDescription).optional(),
});

export const updateLinkInput = z.object({
	id: rowId,
	title: z.string().min(1).max(LIMITS.linkTitle).optional(),
	url: optionalUrl,
	description: z.string().max(LIMITS.linkDescription).nullable().optional(),
	active: z.boolean().optional(),
});

export const reorderInput = z.object({ ids: z.array(rowId).max(1000) });

export const projectInput = z.object({
	name: z.string().min(1).max(LIMITS.projectName),
	description: z.string().max(LIMITS.projectDescription).default(""),
	tech: z
		.array(z.string().max(LIMITS.techItem))
		.max(LIMITS.projectTech)
		.default([]),
	github: optionalUrl,
	demo: optionalUrl,
	status: z.enum(["shipped", "wip", "archived"]).default("shipped"),
});

export const updateProjectInput = projectInput.partial().extend({ id: rowId });

export const snippetInput = z.object({
	title: z.string().min(1).max(LIMITS.snippetTitle),
	language: z.string().min(1).max(LIMITS.snippetLanguage).default("ts"),
	code: z.string().min(1).max(LIMITS.snippetCode),
});

export const updateSnippetInput = snippetInput.partial().extend({ id: rowId });

export const articleInput = z.object({
	title: z.string().min(1).max(LIMITS.articleTitle),
	summary: z.string().max(LIMITS.articleSummary).optional(),
	url: requiredUrl,
	source: z.string().max(LIMITS.articleSource).optional(),
	date: isoDateTime,
});

export const updateArticleInput = z.object({
	id: rowId,
	title: z.string().min(1).max(LIMITS.articleTitle).optional(),
	summary: z.string().max(LIMITS.articleSummary).nullable().optional(),
	url: optionalUrl,
	source: z.string().max(LIMITS.articleSource).nullable().optional(),
	date: isoDateTime.optional(),
});

export const talkInput = z.object({
	title: z.string().min(1).max(LIMITS.talkTitle),
	event: z.string().max(LIMITS.talkEvent).optional(),
	description: z.string().max(LIMITS.talkDescription).optional(),
	date: optionalCalendarDate,
	slidesUrl: nullableOptionalUrl,
	videoUrl: nullableOptionalUrl,
});

export const updateTalkInput = z.object({
	id: rowId,
	title: z.string().min(1).max(LIMITS.talkTitle).optional(),
	event: z.string().max(LIMITS.talkEvent).optional(),
	description: z.string().max(LIMITS.talkDescription).optional(),
	date: optionalCalendarDate,
	slidesUrl: nullableOptionalUrl,
	videoUrl: nullableOptionalUrl,
});

export const supportLinkInput = z.object({
	category: z.enum(["support", "community"]),
	platform: supportPlatform,
	label: z.string().max(LIMITS.supportLabel).optional(),
	url: requiredUrl,
	serverId: z.string().max(LIMITS.serverId).nullable().optional(),
});

export const updateSupportLinkInput = z.object({
	id: rowId,
	category: z.enum(["support", "community"]).optional(),
	platform: supportPlatform.optional(),
	label: z.string().max(LIMITS.supportLabel).optional(),
	url: optionalUrl,
	serverId: z.string().max(LIMITS.serverId).nullable().optional(),
});

export const templateInput = z.object({ templateId: z.string().max(64) });

export const wipeInput = z.object({ username: z.string().max(64) });
