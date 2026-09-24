import { describe, expect, it } from "vitest";
import { detectImageType } from "./image-type";

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

describe("detectImageType", () => {
	it("recognises real image headers", () => {
		expect(
			detectImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0)),
		).toBe("image/png");
		expect(detectImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg");
		expect(
			detectImageType(
				bytes(...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WEBPVP8 ")),
			),
		).toBe("image/webp");
	});

	it.each([
		["HTML", ascii("<html><script>alert(1)</script>")],
		["SVG", ascii('<svg xmlns="http://www.w3.org/2000/svg">')],
		[
			"RIFF that isn't WebP (e.g. WAV)",
			[...ascii("RIFF"), 0, 0, 0, 0, ...ascii("WAVE")],
		],
		["empty", []],
	])("rejects %s", (_label, content) => {
		expect(detectImageType(new Uint8Array(content))).toBeNull();
	});
});
