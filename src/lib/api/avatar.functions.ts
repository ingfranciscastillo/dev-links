import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { user as authUser } from "@/db/auth-schema";
import { db } from "@/db/index";
import { ensureSession } from "@/lib/auth.functions";
import { uploadAvatar } from "@/lib/r2.server";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const uploadMyAvatar = createServerFn({ method: "POST" })
	.validator((data: unknown) => {
		if (!(data instanceof FormData)) {
			throw new Error("Expected multipart form data");
		}
		return data;
	})
	.handler(async ({ data }) => {
		const session = await ensureSession();
		const userId = session.user.id;

		const file = data.get("file");
		if (!(file instanceof File)) {
			throw new Error("Missing file");
		}
		if (!ALLOWED_TYPES.has(file.type)) {
			throw new Error("Only PNG, JPG or WEBP images are allowed");
		}
		if (file.size > MAX_AVATAR_BYTES) {
			throw new Error("Image must be 2MB or smaller");
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const image = await uploadAvatar(userId, buffer, file.type);

		await db
			.update(authUser)
			.set({ image, updatedAt: new Date() })
			.where(eq(authUser.id, userId));

		return { image };
	});
