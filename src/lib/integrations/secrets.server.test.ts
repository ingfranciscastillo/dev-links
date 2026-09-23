import { beforeAll, describe, expect, it } from "vitest";
import { decryptConfigSecrets, encryptConfigSecrets } from "./secrets.server";

beforeAll(() => {
	process.env.INTEGRATIONS_ENCRYPTION_KEY = "test-key-".padEnd(40, "x");
});

describe("integration config secrets", () => {
	it("encrypts only token fields and round-trips them", () => {
		const stored = encryptConfigSecrets({
			access_token: "tok_123",
			refresh_token: "ref_456",
			pinned: ["o/r"],
		});
		expect(stored.access_token).toMatch(/^enc:v1:/);
		expect(stored.refresh_token).toMatch(/^enc:v1:/);
		expect(stored.pinned).toEqual(["o/r"]);
		expect(JSON.stringify(stored)).not.toContain("tok_123");
		expect(decryptConfigSecrets(stored)).toMatchObject({
			access_token: "tok_123",
			refresh_token: "ref_456",
		});
	});

	it("does not re-encrypt already encrypted values", () => {
		const once = encryptConfigSecrets({ access_token: "tok" });
		expect(encryptConfigSecrets(once)).toEqual(once);
	});

	it("passes legacy plaintext tokens through", () => {
		expect(decryptConfigSecrets({ access_token: "legacy" })).toEqual({
			access_token: "legacy",
		});
	});

	it("rejects tampered ciphertext", () => {
		const { access_token } = encryptConfigSecrets({ access_token: "tok" });
		const value = String(access_token);
		const tampered = `${value.slice(0, -2)}${value.endsWith("AA") ? "BB" : "AA"}`;
		expect(() => decryptConfigSecrets({ access_token: tampered })).toThrow(
			/reconnect/,
		);
	});
});
