import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM ?? "no-reply@devlinks.app";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

const client = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

// For interpolating user-controlled values (names, messages) into email HTML.
export function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

type SendArgs = {
	to: string;
	subject: string;
	html: string;
	text?: string;
};

export async function sendEmail({ to, subject, html, text }: SendArgs) {
	if (!client) {
		console.warn(
			"[email] RESEND_API_KEY missing, printing to console instead of sending.",
			{ to, subject },
		);
		console.info(text ?? html);
		return;
	}

	await client.emails.send({
		from: FROM,
		to,
		subject,
		html,
		text,
	});
}
