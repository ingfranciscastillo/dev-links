import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/privacy")({
	head: () => ({
		meta: [
			{ title: "Privacy Policy — DevLinks" },
			{
				name: "description",
				content: "How DevLinks collects, uses, and protects your data.",
			},
		],
	}),
	component: PrivacyPage,
});

const EFFECTIVE_DATE = "September 15, 2026";
const CONTACT_EMAIL = "support@devlinks.app";

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="border-t border-border py-10 first:border-t-0 first:pt-0">
			<h2 className="font-display text-2xl tracking-[-0.02em] sm:text-3xl">
				{title}
			</h2>
			<div className="mt-4 space-y-4 text-sm leading-relaxed text-muted-foreground">
				{children}
			</div>
		</section>
	);
}

function PrivacyPage() {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Legal
				</p>

				<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Privacy Policy.
				</h1>

				<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
					Effective {EFFECTIVE_DATE}. This describes what DevLinks collects,
					why, and what control you have over it.
				</p>

				<div className="mt-16">
					<Section title="Who this is">
						<p>
							DevLinks (devlinks.app) is a developer profile and link-in-bio
							tool operated by Francis Castillo Cruz, an individual developer —
							not a registered company. This policy covers the DevLinks
							dashboard, public profile pages (devlinks.app/@username), and the
							marketing site.
						</p>
						<p>
							For anything in this policy, or to exercise any of the rights
							below, email{" "}
							<a
								href={`mailto:${CONTACT_EMAIL}`}
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								{CONTACT_EMAIL}
							</a>
							.
						</p>
					</Section>

					<Section title="Information we collect">
						<p>
							<strong className="text-foreground">Account information.</strong>{" "}
							When you sign up, we collect your name, email address, and a
							password (if you use email/password) — or, if you sign in with
							GitHub or Google, the name, email, and avatar your OAuth provider
							shares with us. You choose a username, which becomes your public
							profile address.
						</p>
						<p>
							<strong className="text-foreground">Profile content.</strong>{" "}
							Anything you add to build your profile — bio, location, primary
							language, seniority, availability for hire, website, links,
							projects, code snippets, articles, talks, support/donation links,
							and theme settings (including custom CSS, on the Pro plan). Your
							profile page is public by design: everything here is meant to be
							visible to anyone who visits your DevLinks URL.
						</p>
						<p>
							<strong className="text-foreground">
								Connected accounts (integrations).
							</strong>{" "}
							DevLinks can display live stats from other services on your
							profile. Most integrations (GitHub, GitLab, Dev.to, Medium, Stack
							Overflow, WakaTime, LeetCode, npm, Bluesky, Mastodon, Docker Hub,
							YouTube, Hugging Face) only need the public username you type in —
							we fetch publicly available data from that service's own API and
							cache it. We don't authenticate as you or store a password or
							token for these.
						</p>
						<p>
							Three integrations — Product Hunt, Dribbble, and Pinterest — work
							differently: their APIs only expose your own content when you
							connect via OAuth, so we store an access token (and refresh token,
							if the service issues one) after you authorize the connection.
							That token is used only to fetch your own posts, shots, or pins
							for display on your profile — never to act on your behalf
							otherwise, and never shared with anyone else.
						</p>
						<p>
							<strong className="text-foreground">Billing.</strong> If you
							upgrade to Pro, payments are handled entirely by Dodo Payments,
							our payment processor. We store a Dodo customer ID to link your
							account to your subscription; we never see or store your full card
							number.
						</p>
						<p>
							<strong className="text-foreground">
								Contact form and support.
							</strong>{" "}
							If you email us or use the contact form, we keep your name, email,
							and message to respond to you.
						</p>
						<p>
							<strong className="text-foreground">Avatar images.</strong>{" "}
							Profile pictures you upload are stored on Cloudflare R2, our file
							storage provider.
						</p>
					</Section>

					<Section title="Information we collect automatically">
						<p>
							<strong className="text-foreground">
								Profile visit analytics.
							</strong>{" "}
							When someone views a public DevLinks profile or clicks a link on
							one, we log: a hashed version of the visitor's IP address (we
							never store the raw IP — it's run through SHA-256 with a salt that
							rotates daily, so it can't be reversed or matched across days), a
							coarse device/browser/OS category parsed from the user agent,
							country (from a CDN header, not precise location), the referring
							page, and which link was clicked. This exists so profile owners
							can see aggregate traffic to their own page — we don't use it to
							build a profile of individual visitors.
						</p>
						<p>
							<strong className="text-foreground">Session cookies.</strong> When
							you sign in, we set a session cookie so you stay logged in. The
							session record includes your IP address and user agent, used only
							to detect suspicious activity (like a login from an unexpected
							location).
						</p>
						<p>
							<strong className="text-foreground">Product analytics.</strong> We
							use PostHog to understand how people use DevLinks (which pages get
							visited, which features get used). PostHog only builds a full
							identity profile for signed-in users; anonymous visitors are not
							persistently tracked across sessions.
						</p>
					</Section>

					<Section title="How we use your information">
						<ul className="list-disc space-y-2 pl-5">
							<li>
								To create and run your DevLinks account and public profile.
							</li>
							<li>To fetch and display data from services you've connected.</li>
							<li>To process Pro subscription payments.</li>
							<li>To respond to support requests.</li>
							<li>
								To keep the service secure — detecting abuse, fraud, or
								unauthorized access.
							</li>
							<li>
								To understand usage patterns and improve DevLinks (product
								analytics).
							</li>
							<li>To comply with legal obligations.</li>
						</ul>
						<p>We do not sell your personal information, ever.</p>
					</Section>

					<Section title="Who we share information with">
						<p>
							We don't sell or rent your data. We share it only with the service
							providers that make DevLinks work, each only for the purpose
							below:
						</p>
						<ul className="list-disc space-y-2 pl-5">
							<li>
								<strong className="text-foreground">Neon</strong> — hosts our
								Postgres database (all account and profile data).
							</li>
							<li>
								<strong className="text-foreground">Vercel</strong> — hosts the
								application and runs our scheduled jobs.
							</li>
							<li>
								<strong className="text-foreground">Cloudflare R2</strong> —
								stores uploaded avatar images.
							</li>
							<li>
								<strong className="text-foreground">Resend</strong> — sends
								transactional email (verification, password reset, contact form
								replies).
							</li>
							<li>
								<strong className="text-foreground">Dodo Payments</strong> —
								processes Pro plan payments.
							</li>
							<li>
								<strong className="text-foreground">PostHog</strong> — product
								analytics.
							</li>
							<li>
								<strong className="text-foreground">
									GitHub, Google, Product Hunt, Dribbble, Pinterest
								</strong>{" "}
								— OAuth sign-in or, for the last three, the connected-account
								flow described above.
							</li>
							<li>
								<strong className="text-foreground">
									The other services you connect
								</strong>{" "}
								(GitLab, Dev.to, Medium, Stack Overflow, WakaTime, LeetCode,
								npm, Bluesky, Mastodon, Docker Hub, YouTube, Hugging Face) — we
								send them only the public username you provide, to fetch your
								public data from their API.
							</li>
						</ul>
						<p>
							We may also disclose information if required by law, or to protect
							the rights, property, or safety of DevLinks, our users, or the
							public.
						</p>
					</Section>

					<Section title="Where your data lives">
						<p>
							DevLinks and the providers listed above operate infrastructure in
							the United States. If you're accessing DevLinks from outside the
							US, your information will be processed there.{" "}
							<span className="italic">
								[We haven't yet confirmed each provider's specific
								international-transfer safeguards (e.g. Standard Contractual
								Clauses) — get this reviewed before relying on it for EU/UK
								users.]
							</span>
						</p>
					</Section>

					<Section title="How long we keep your data">
						<ul className="list-disc space-y-2 pl-5">
							<li>
								Account and profile data: kept as long as your account exists.
							</li>
							<li>
								Deleting your account deletes your profile content and
								disconnects all integrations. Cached data from connected
								services is deleted with it.
							</li>
							<li>
								Profile visit analytics (hashed IP, device, referrer): kept for
								12 months, then deleted.
							</li>
							<li>
								Contact form messages: kept for as long as needed to resolve
								your request, generally no more than 2 years.
							</li>
						</ul>
					</Section>

					<Section title="Your rights">
						<p>
							Depending on where you live, you may have the right to access,
							correct, delete, or export your data, or to object to or restrict
							certain processing. To exercise any of these, email{" "}
							<a
								href={`mailto:${CONTACT_EMAIL}`}
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								{CONTACT_EMAIL}
							</a>
							. We'll respond within 30 days.
						</p>
						<p>
							You can also edit or delete most of your profile content directly
							from the dashboard at any time, and disconnect any integration
							whenever you want.
						</p>
						<p>
							If you're in the EU/UK and believe we haven't addressed your
							concern, you have the right to lodge a complaint with your local
							data protection authority.{" "}
							<span className="italic">
								[Legal basis for each processing activity under GDPR Art. 6
								hasn't been formally mapped out — recommend legal review before
								this policy is relied on for EU users at scale.]
							</span>
						</p>
					</Section>

					<Section title="Cookies">
						<p>
							We use a session cookie (to keep you signed in) and a short-lived
							cookie during the OAuth connection flow for Product Hunt,
							Dribbble, and Pinterest (to prevent cross-site request forgery —
							it's deleted immediately after the connection completes). We don't
							use advertising or cross-site tracking cookies.
						</p>
					</Section>

					<Section title="Security">
						<p>
							We use industry-standard measures to protect your data: encrypted
							connections (HTTPS) everywhere, hashed passwords, OAuth tokens
							stored server-side and never exposed to the browser, and IP
							addresses hashed with a rotating salt for analytics rather than
							stored raw. No system is 100% secure, but if we ever discover a
							breach affecting your data, we'll notify you.
						</p>
					</Section>

					<Section title="Children's privacy">
						<p>
							DevLinks is not directed at children under 13, and we don't
							knowingly collect data from them. If you believe a child has
							created an account, email us and we'll delete it.
						</p>
					</Section>

					<Section title="Changes to this policy">
						<p>
							If we make a material change to this policy, we'll update the
							effective date above and, for significant changes, notify you by
							email.
						</p>
					</Section>

					<Section title="Contact">
						<p>
							Questions about this policy or your data:{" "}
							<a
								href={`mailto:${CONTACT_EMAIL}`}
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								{CONTACT_EMAIL}
							</a>
							.
						</p>
					</Section>
				</div>
			</main>

			<Footer />
		</div>
	);
}
