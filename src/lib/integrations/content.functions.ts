import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/index";
import { supportLinks, talks } from "@/db/schema";
import { authMiddleware } from "@/lib/auth-middleware";

// Same authoritative scheme allow-list as profile-data.functions.ts — zod's
// .url() only checks syntax, not scheme, so it would still accept
// "javascript:...". This is a separate write path into the same
// talks/supportLinks tables that render as href on the public profile.
const SAFE_URL_SCHEMES = new Set(["http:", "https:", "mailto:", "tel:"]);
function isSafeUrl(value: string): boolean {
	try {
		return SAFE_URL_SCHEMES.has(new URL(value).protocol);
	} catch {
		return false;
	}
}
const urlOrEmpty = z
	.string()
	.trim()
	.max(500)
	.refine(
		(v) => v === "" || isSafeUrl(v),
		"Must be a valid http(s)/mailto/tel URL",
	);

const talkInput = z.object({
	title: z.string().trim().min(1).max(160),
	event: z.string().trim().max(120).default(""),
	description: z.string().trim().max(400).default(""),
	date: z.string().trim().max(20).nullable().default(null),
	slides_url: urlOrEmpty.nullable().default(null),
	video_url: urlOrEmpty.nullable().default(null),
});

const supportInput = z.object({
	category: z.enum(["support", "community"]),
	platform: z.enum([
		"buymeacoffee",
		"kofi",
		"ghsponsors",
		"patreon",
		"discord",
		"slack",
	]),
	label: z.string().trim().max(80).default(""),
	url: z
		.string()
		.trim()
		.min(1)
		.max(500)
		.refine(isSafeUrl, "Must be a valid http(s)/mailto/tel URL"),
	server_id: z
		.string()
		.trim()
		.max(64)
		.nullable()
		.or(z.literal(""))
		.default(null),
});

const idInput = z.object({
	id: z.string().uuid(),
});

export const listMyTalks = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const { userId } = context;

		return db
			.select({
				id: talks.id,
				title: talks.title,
				event: talks.event,
				description: talks.description,
				date: talks.date,
				slidesUrl: talks.slidesUrl,
				videoUrl: talks.videoUrl,
				position: talks.position,
			})
			.from(talks)
			.where(eq(talks.userId, userId))
			.orderBy(desc(talks.date));
	});

export const upsertTalk = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) =>
		talkInput
			.extend({
				id: z.string().uuid().optional(),
			})
			.parse(input),
	)
	.handler(async ({ data, context }) => {
		const { userId } = context;

		const values = {
			userId,
			title: data.title,
			event: data.event,
			description: data.description,
			date: data.date || null,
			slidesUrl: data.slides_url || null,
			videoUrl: data.video_url || null,
		};

		if (data.id) {
			await db
				.update(talks)
				.set({
					title: values.title,
					event: values.event,
					description: values.description,
					date: values.date,
					slidesUrl: values.slidesUrl,
					videoUrl: values.videoUrl,
					updatedAt: new Date(),
				})
				.where(and(eq(talks.id, data.id), eq(talks.userId, userId)));
		} else {
			await db.insert(talks).values(values);
		}

		return { ok: true as const };
	});

export const deleteTalk = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;

		await db
			.delete(talks)
			.where(and(eq(talks.id, data.id), eq(talks.userId, userId)));

		return { ok: true as const };
	});

export const listMySupportLinks = createServerFn({ method: "GET" })
	.middleware([authMiddleware])
	.handler(async ({ context }) => {
		const { userId } = context;

		return db
			.select({
				id: supportLinks.id,
				category: supportLinks.category,
				platform: supportLinks.platform,
				label: supportLinks.label,
				url: supportLinks.url,
				serverId: supportLinks.serverId,
				position: supportLinks.position,
			})
			.from(supportLinks)
			.where(eq(supportLinks.userId, userId))
			.orderBy(asc(supportLinks.position));
	});

export const upsertSupportLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) =>
		supportInput
			.extend({
				id: z.string().uuid().optional(),
			})
			.parse(input),
	)
	.handler(async ({ data, context }) => {
		const { userId } = context;

		const values = {
			userId,
			category: data.category,
			platform: data.platform,
			label: data.label,
			url: data.url,
			serverId: data.server_id || null,
		};

		if (data.id) {
			await db
				.update(supportLinks)
				.set({
					category: values.category,
					platform: values.platform,
					label: values.label,
					url: values.url,
					serverId: values.serverId,
					updatedAt: new Date(),
				})
				.where(
					and(eq(supportLinks.id, data.id), eq(supportLinks.userId, userId)),
				);
		} else {
			await db.insert(supportLinks).values(values);
		}

		return { ok: true as const };
	});

export const deleteSupportLink = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((input) => idInput.parse(input))
	.handler(async ({ data, context }) => {
		const { userId } = context;

		await db
			.delete(supportLinks)
			.where(
				and(eq(supportLinks.id, data.id), eq(supportLinks.userId, userId)),
			);

		return { ok: true as const };
	});
