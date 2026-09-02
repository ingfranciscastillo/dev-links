import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { sendEmail } from "@/lib/email";
import { emailSchema } from "@/lib/schemas/auth";

export const contactSchema = z.object({
	name: z.string().min(1).max(120),
	email: emailSchema,
	message: z.string().min(1).max(4000),
	// Honeypot: campo oculto en el form real, invisible para humanos. Los bots
	// que autocompletan todo lo llenan — si viene con algo, fingimos éxito sin
	// mandar el email.
	website: z.string().optional(),
});

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export const sendContactMessage = createServerFn({ method: "POST" })
	.validator((input) => contactSchema.parse(input))
	.handler(async ({ data }) => {
		if (data.website) {
			return { ok: true as const };
		}

		const to = process.env.CONTACT_EMAIL || "support@devlinks.app";
		const name = escapeHtml(data.name);
		const email = escapeHtml(data.email);
		const message = escapeHtml(data.message);

		await sendEmail({
			to,
			subject: `New contact message from ${data.name}`,
			html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message.replace(/\n/g, "<br>")}</p>`,
			text: `From: ${data.name} (${data.email})\n\n${data.message}`,
		});

		return { ok: true as const };
	});
