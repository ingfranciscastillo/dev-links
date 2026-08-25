import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * Solo acepta rutas relativas de la propia app ("/x"), nunca "//host",
 * "\x" ni esquemas absolutos — previene open redirect vía ?redirect=.
 */
export function safeRedirectPath(
	value: string | undefined | null,
): string | null {
	if (!value) return null;
	if (
		!value.startsWith("/") ||
		value.startsWith("//") ||
		value.includes("\\")
	) {
		return null;
	}
	return value;
}
