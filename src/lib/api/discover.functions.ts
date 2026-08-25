import { createServerFn } from "@tanstack/react-start";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { user as userTable } from "@/db/auth-schema";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";

export type DiscoverResult = {
	id: string;
	username: string;
	name: string | null;
	bio: string | null;
	location: string | null;
	country: string | null;
	available: boolean;
	seniority: string | null;
	primary_language: string | null;
	technologies: string[];
};

const inputSchema = z.object({
	q: z.string().max(120).optional().default(""),
	language: z.string().max(40).optional().nullable(),
	country: z.string().max(4).optional().nullable(),
	available: z.boolean().optional().nullable(),
	seniority: z.string().max(20).optional().nullable(),
	technologies: z.array(z.string().max(40)).max(8).optional().default([]),
	limit: z.number().int().min(1).max(48).optional().default(24),
});

export const searchProfiles = createServerFn({ method: "GET" })
	.inputValidator((raw) => inputSchema.parse(raw))
	.handler(async ({ data }): Promise<DiscoverResult[]> => {
		try {
			// TODO: full-text search via profiles.search_tsv once the maintenance
			// trigger is in place. For now we ignore `data.q` (full-text column is
			// declared and GIN-indexed but never populated).
			const query = data.q.trim();
			void query;

			const baseQuery = db
				.select({
					id: profiles.id,
					username: userTable.username,
					name: userTable.name,
					bio: profiles.bio,
					location: profiles.location,
					country: profiles.country,
					available: profiles.available,
					seniority: profiles.seniority,
					primary_language: profiles.primaryLanguage,
					technologies: profiles.technologies,
				})
				.from(profiles)
				.leftJoin(userTable, eq(userTable.id, profiles.id));

			const conditions = [];

			if (data.language)
				conditions.push(eq(profiles.primaryLanguage, data.language));
			if (data.country) conditions.push(eq(profiles.country, data.country));
			if (data.available === true)
				conditions.push(eq(profiles.available, true));
			if (data.seniority)
				conditions.push(eq(profiles.seniority, data.seniority));
			if (data.technologies && data.technologies.length > 0) {
				conditions.push(
					sql`${profiles.technologies} @> ${data.technologies}::text[]`,
				);
			}

			const rows = await (conditions.length > 0
				? baseQuery.where(sql.join(conditions, sql.raw(" AND ")))
				: baseQuery
			)
				.orderBy(desc(profiles.updatedAt))
				.limit(data.limit);

			return rows.map((r) => ({
				id: r.id,
				username: r.username ?? "",
				name: r.name,
				bio: r.bio,
				location: r.location,
				country: r.country,
				available: r.available,
				seniority: r.seniority,
				primary_language: r.primary_language,
				technologies: r.technologies ?? [],
			}));
		} catch (error) {
			console.warn("[discover] searchProfiles failed:", error);
			return [];
		}
	});
