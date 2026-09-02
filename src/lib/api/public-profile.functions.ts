import { createServerFn } from "@tanstack/react-start";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { user as authUserTable } from "@/db/auth-schema";
import { db } from "@/db/index";
import {
	articles,
	integrationCache,
	links,
	profiles,
	projects,
	snippets,
	supportLinks,
	talks,
	themes,
} from "@/db/schema";
import type { Json } from "@/lib/api/integrations/account.functions";
import type { Provider } from "@/lib/integrations/types";
import type { ProfileData } from "@/lib/schemas";
import { parseThemeConfig } from "@/lib/theme-config";

export type PublicIntegration = {
	provider: Provider;
	kind: string;
	payload: Json;
	fetchedAt: string;
};

export type PublicProfile = {
	id: string;
	username: string;
	name: string;
	image: string | null;
	bio: string;
	location: string;
	website: string;
	available: boolean;
	data: ProfileData;
	integrations: PublicIntegration[];
} | null;

export const getPublicProfile = createServerFn({ method: "GET" })
	.validator((input) =>
		z.object({ username: z.string().min(1).max(64) }).parse(input),
	)
	.handler(async ({ data }): Promise<PublicProfile> => {
		// lower(username) = input: sin comodines inyectables (% _) y compatible
		// con el índice unique de username.
		const [profile] = await db
			.select({
				id: profiles.id,
				bio: profiles.bio,
				location: profiles.location,
				website: profiles.website,
				available: profiles.available,
				username: authUserTable.username,
				name: authUserTable.name,
				image: authUserTable.image,
			})
			.from(profiles)
			.innerJoin(authUserTable, eq(authUserTable.id, profiles.id))
			.where(
				sql`lower(${authUserTable.username}) = ${data.username.toLowerCase()}`,
			)
			.limit(1);

		if (!profile) return null;

		const userId = profile.id;
		const [
			linkRows,
			projectRows,
			snippetRows,
			articleRows,
			themeRow,
			integrationRows,
			talkRows,
			supportLinkRows,
		] = await Promise.all([
			db
				.select()
				.from(links)
				.where(and(eq(links.userId, userId), eq(links.active, true)))
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
			db
				.select({
					provider: integrationCache.provider,
					kind: integrationCache.kind,
					payload: integrationCache.payload,
					fetchedAt: integrationCache.fetchedAt,
				})
				.from(integrationCache)
				.where(eq(integrationCache.userId, userId)),
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
		]);

		const profileData: ProfileData = {
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

		return {
			id: profile.id,
			username: profile.username ?? data.username,
			name: profile.name ?? profile.username ?? data.username,
			image: profile.image ?? null,
			bio: profile.bio ?? "",
			location: profile.location ?? "",
			website: profile.website ?? "",
			available: profile.available,
			data: profileData,
			integrations: integrationRows.map((r) => ({
				provider: r.provider,
				kind: r.kind,
				payload: r.payload as Json,
				fetchedAt: r.fetchedAt.toISOString(),
			})),
		};
	});
