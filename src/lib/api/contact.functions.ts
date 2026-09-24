import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { escapeHtml, sendEmail } from "@/lib/email";
import { consumeRateLimit } from "@/lib/rate-limit.server";
import { emailSchema } from "@/lib/schemas/auth";
import { clientIp, securityLog } from "@/lib/security-log";

const CONTACT_WINDOW_MS = 60 * 60 * 1000;
const CONTACT_MAX = 3;

export const contactSchema = z.object({
	name: z.string().min(1).max(120),
	email: emailSchema,
	message: z.string().min(1).max(4000),
	// Honeypot: campo oculto en el form real, invisible para humanos. Los bots
	// que autocompletan todo lo llenan — si viene con algo, fingimos éxito sin
	// mandar el email.
	website: z.string().optional(),
});

export const sendContactMessage = createServerFn({ method: "POST" })
	.validator((input) => contactSchema.parse(input))
	.handler(async ({ data }) => {
		if (data.website) {
			return { ok: true as const };
		}

		// Public and sends an email per call: without a limit anyone could
		// flood the inbox and burn the email provider's quota.
		const ip = clientIp(getRequestHeaders()) ?? "unknown";
		if (
			!(await consumeRateLimit("contact", ip, CONTACT_WINDOW_MS, CONTACT_MAX))
		) {
			securityLog("contact.rate_limited", "blocked", { ip });
			throw new Error("Too many messages. Please try again later.");
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
