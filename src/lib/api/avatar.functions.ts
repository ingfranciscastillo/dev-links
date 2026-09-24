import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth-middleware";
import { detectImageType } from "@/lib/image-type";
import { uploadAvatar } from "@/lib/r2.server";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const uploadMyAvatar = createServerFn({ method: "POST" })
	.middleware([authMiddleware])
	.validator((data: unknown) => {
		if (!(data instanceof FormData)) {
			throw new Error("Expected multipart form data");
		}
		return data;
	})
	.handler(async ({ data, context }) => {
		const { userId } = context;

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
		// file.type is whatever the client claims; the bytes decide, and the
		// detected type (not the declared one) is what R2 serves it as.
		const detectedType = detectImageType(buffer);
		if (!detectedType) {
			throw new Error("Only PNG, JPG or WEBP images are allowed");
		}
		const image = await uploadAvatar(userId, buffer, detectedType);

		// No escribe user.image acá — el caller hace authClient.updateUser()
		// con la URL devuelta, para que better-auth reemita la cookie de
		// sesión (ver comentario en useUploadAvatar).
		return { image };
	});
