import type { z } from "zod";

/**
 * Adapts a Zod schema to TanStack Form field validators.
 * Returns the first issue's message on failure, undefined on success.
 */
export function zodField<T extends z.ZodTypeAny>(schema: T) {
	return ({ value }: { value: unknown }) => {
		const result = schema.safeParse(value);
		if (result.success) return undefined;
		return result.error.issues[0]?.message ?? "Invalid value";
	};
}
