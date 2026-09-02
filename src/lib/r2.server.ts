import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

let client: S3Client | null = null;

function getClient() {
	const accountId = process.env.R2_ACCOUNT_ID;
	const accessKeyId = process.env.R2_ACCESS_KEY_ID;
	const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

	if (!accountId || !accessKeyId || !secretAccessKey) {
		throw new Error(
			"R2 is not configured (missing R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY)",
		);
	}

	if (!client) {
		client = new S3Client({
			region: "auto",
			endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
			credentials: { accessKeyId, secretAccessKey },
		});
	}

	return client;
}

// Una sola key por usuario (sin extensión): un re-upload pisa el objeto
// anterior en vez de dejar huérfanos con distinta extensión.
export async function uploadAvatar(
	userId: string,
	buffer: Buffer,
	contentType: string,
) {
	const bucket = process.env.R2_BUCKET_NAME;
	const publicUrl = process.env.R2_PUBLIC_URL;

	if (!bucket || !publicUrl) {
		throw new Error(
			"R2 is not configured (missing R2_BUCKET_NAME / R2_PUBLIC_URL)",
		);
	}

	const key = `avatars/${userId}`;

	await getClient().send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: buffer,
			ContentType: contentType,
			CacheControl: "public, max-age=31536000, immutable",
		}),
	);

	// Cache-bust: la key no cambia entre uploads pero el contenido sí.
	return `${publicUrl.replace(/\/$/, "")}/${key}?v=${Date.now()}`;
}
