import { createServerFn } from "@tanstack/react-start";
import { and, desc, eq, ilike, or, type SQL, sql } from "drizzle-orm";
import { z } from "zod";
import { user as userTable } from "@/db/auth-schema";
import { db } from "@/db/index";
import { profiles } from "@/db/schema";

export type DiscoverResult = {
	id: string;
	username: string;
	name: string | null;
	bio: string | null;
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
	.validator((raw) => inputSchema.parse(raw))
	.handler(async ({ data }): Promise<DiscoverResult[]> => {
		try {
			const baseQuery = db
				.select({
					id: profiles.id,
					username: userTable.username,
					name: userTable.name,
					bio: profiles.bio,
					country: profiles.country,
					available: profiles.available,
					seniority: profiles.seniority,
					primary_language: profiles.primaryLanguage,
					technologies: profiles.technologies,
				})
				.from(profiles)
				.leftJoin(userTable, eq(userTable.id, profiles.id));

			// Búsqueda de texto simple (ILIKE) sobre name/username/bio/location.
			// Pendiente: full-text vía profiles.search_tsv cuando exista el
			// trigger de mantenimiento (columna declarada + GIN, aún sin poblar).
			const conditions: SQL[] = [];

			const query = data.q.trim();
			if (query) {
				const pattern = `%${query.replace(/[%_\\]/g, "\\$&")}%`;
				const textMatch = or(
					ilike(userTable.name, pattern),
					ilike(userTable.username, pattern),
					ilike(profiles.bio, pattern),
				);
				if (textMatch) conditions.push(textMatch);
			}

			if (data.language)
				// ilike, no eq: primaryLanguage es texto libre en el perfil
				// ("typescript", "TypeScript", "Typescript" son todos válidos),
				// mientras los botones de /discover mandan una casing fija —
				// con eq, cualquier perfil que no coincidiera letra por letra
				// simplemente no aparecía nunca en esa búsqueda.
				conditions.push(ilike(profiles.primaryLanguage, data.language));
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

			const rows = await baseQuery
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(profiles.updatedAt))
				.limit(data.limit);

			return rows.map((r) => ({
				id: r.id,
				username: r.username ?? "",
				name: r.name,
				bio: r.bio,
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
