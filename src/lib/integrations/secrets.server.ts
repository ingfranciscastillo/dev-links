// Runs on the server only. Do NOT import from client-reachable modules at module scope.
//
// At-rest encryption for the provider tokens the OAuth callbacks
// (Dribbble/Pinterest/Product Hunt) keep in integration_accounts.config.
// AES-256-GCM, key derived from INTEGRATIONS_ENCRYPTION_KEY via HKDF so any
// sufficiently long random string works as the env value. Encrypted values
// are tagged with a version prefix; untagged values are plaintext rows
// written before this existed and are passed through as-is, so they keep
// working until the user reconnects the provider.

import {
	createCipheriv,
	createDecipheriv,
	hkdfSync,
	randomBytes,
} from "node:crypto";

export const SECRET_CONFIG_KEYS = new Set(["access_token", "refresh_token"]);

const PREFIX = "enc:v1:";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const MIN_KEY_LENGTH = 32;

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
	if (cachedKey) return cachedKey;
	const secret = process.env.INTEGRATIONS_ENCRYPTION_KEY;
	if (!secret || secret.length < MIN_KEY_LENGTH) {
		throw new Error(
			`INTEGRATIONS_ENCRYPTION_KEY must be set (at least ${MIN_KEY_LENGTH} characters)`,
		);
	}
	cachedKey = Buffer.from(
		hkdfSync(
			"sha256",
			secret,
			"devlinks-integrations",
			"integration-config-tokens-v1",
			32,
		),
	);
	return cachedKey;
}

function encryptValue(plaintext: string): string {
	const iv = randomBytes(IV_BYTES);
	const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
	const ciphertext = Buffer.concat([
		cipher.update(plaintext, "utf8"),
		cipher.final(),
	]);
	const payload = Buffer.concat([iv, cipher.getAuthTag(), ciphertext]);
	return `${PREFIX}${payload.toString("base64url")}`;
}

function decryptValue(value: string): string {
	if (!value.startsWith(PREFIX)) return value;
	const payload = Buffer.from(value.slice(PREFIX.length), "base64url");
	const iv = payload.subarray(0, IV_BYTES);
	const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
	const ciphertext = payload.subarray(IV_BYTES + TAG_BYTES);
	const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
	decipher.setAuthTag(tag);
	try {
		return Buffer.concat([
			decipher.update(ciphertext),
			decipher.final(),
		]).toString("utf8");
	} catch {
		throw new Error(
			"Stored integration token can't be decrypted — reconnect the integration",
		);
	}
}

function mapSecrets(
	config: Record<string, unknown>,
	fn: (value: string) => string,
): Record<string, unknown> {
	return Object.fromEntries(
		Object.entries(config).map(([key, value]) => [
			key,
			SECRET_CONFIG_KEYS.has(key) && typeof value === "string" && value
				? fn(value)
				: value,
		]),
	);
}

export function encryptConfigSecrets(
	config: Record<string, unknown>,
): Record<string, unknown> {
	return mapSecrets(config, (v) =>
		v.startsWith(PREFIX) ? v : encryptValue(v),
	);
}

export function decryptConfigSecrets(
	config: Record<string, unknown>,
): Record<string, unknown> {
	return mapSecrets(config, decryptValue);
}
