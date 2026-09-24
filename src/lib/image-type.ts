// Identifies an upload by its leading bytes ("magic numbers") instead of the
// MIME type the client declares, which is attacker-controlled.
export type AvatarMimeType = "image/png" | "image/jpeg" | "image/webp";

export function detectImageType(bytes: Uint8Array): AvatarMimeType | null {
	const starts = (sig: number[], offset = 0) =>
		bytes.length >= offset + sig.length &&
		sig.every((b, i) => bytes[offset + i] === b);

	if (starts([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
		return "image/png";
	}
	if (starts([0xff, 0xd8, 0xff])) return "image/jpeg";
	// "RIFF" <size> "WEBP"
	if (starts([0x52, 0x49, 0x46, 0x46]) && starts([0x57, 0x45, 0x42, 0x50], 8)) {
		return "image/webp";
	}
	return null;
}
