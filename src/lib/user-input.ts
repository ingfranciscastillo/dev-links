// Validation for the user fields better-auth writes directly from the client
// (sign-up and /update-user bypass profile-data's validators): used by the
// hooks.before in auth.ts. Kept free of server imports so it's unit-testable.

export const NAME_MIN = 2;
export const NAME_MAX = 60;

// Avatars only ever come from our R2 bucket (upload) or the OAuth providers.
// Anything else — another host, or a multi-MB data: URL — is rejected; the
// CSP would block external hosts anyway, but data: URLs would bloat the
// profile page and the session cookie cache.
const OAUTH_AVATAR_ORIGINS = [
	"https://avatars.githubusercontent.com",
	"https://lh3.googleusercontent.com",
];

export function allowedImageOrigins(r2PublicUrl: string | undefined) {
	const origins = [...OAUTH_AVATAR_ORIGINS];
	if (r2PublicUrl) {
		try {
			origins.push(new URL(r2PublicUrl).origin);
		} catch {
			// misconfigured env: only OAuth avatars are accepted
		}
	}
	return origins;
}

export function validateUserInput(
	body: Record<string, unknown> | undefined,
	imageOrigins: readonly string[],
): string | null {
	if (!body) return null;

	for (const key of ["name", "displayName"] as const) {
		const value = body[key];
		if (value === undefined || value === null) continue;
		if (typeof value !== "string") return `${key} must be a string`;
		const length = value.trim().length;
		if (key === "name" && length < NAME_MIN) {
			return `Name must be at least ${NAME_MIN} characters`;
		}
		if (length > NAME_MAX) {
			return `${key === "name" ? "Name" : "Display name"} must be at most ${NAME_MAX} characters`;
		}
	}

	const image = body.image;
	if (image !== undefined && image !== null && image !== "") {
		if (typeof image !== "string" || image.length > 2048) {
			return "Invalid image URL";
		}
		let origin: string;
		try {
			origin = new URL(image).origin;
		} catch {
			return "Invalid image URL";
		}
		if (!imageOrigins.includes(origin)) return "Image host is not allowed";
	}

	return null;
}
