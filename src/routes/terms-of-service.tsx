import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

export const Route = createFileRoute("/terms-of-service")({
	head: () => ({
		meta: [
			{ title: "Terms of Service — DevLinks" },
			{
				name: "description",
				content: "The terms that govern using DevLinks.",
			},
		],
	}),
	component: TermsPage,
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

function TermsPage() {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Legal
				</p>

				<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Terms of Service.
				</h1>

				<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
					Effective {EFFECTIVE_DATE}. By creating an account or using DevLinks,
					you agree to these terms. See also our{" "}
					<Link
						to="/privacy"
						className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
					>
						Privacy Policy
					</Link>
					.
				</p>

				<div className="mt-16">
					<Section title="Who this is">
						<p>
							DevLinks (devlinks.app) is operated by Francis Castillo Cruz, an
							individual developer — not a registered company. These terms form
							an agreement between you and Francis Castillo Cruz regarding your
							use of DevLinks: the dashboard, public profile pages
							(devlinks.app/@username), and the marketing site.
						</p>
					</Section>

					<Section title="The service">
						<p>
							DevLinks lets you build a public developer profile — links,
							projects, code snippets, articles, talks, and live stats synced
							from services like GitHub, Dev.to, and others you connect —
							published at a public URL you choose. Some features (see{" "}
							<a
								href="/#pricing"
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								Pricing
							</a>
							) require a paid Pro subscription.
						</p>
					</Section>

					<Section title="Your account">
						<ul className="list-disc space-y-2 pl-5">
							<li>
								You must be at least 13 years old to create a DevLinks account.
							</li>
							<li>
								You're responsible for the security of your account — whatever
								credentials you sign in with — and for all activity that happens
								under it.
							</li>
							<li>
								The username you choose becomes part of your public profile URL.
								We can reclaim usernames that are inactive, impersonate someone
								else, or violate these terms.
							</li>
							<li>
								Give us accurate information when you sign up. If anything
								changes, keep your account up to date.
							</li>
						</ul>
					</Section>

					<Section title="Your content">
						<p>
							You own everything you post to DevLinks — your bio, links,
							projects, snippets, articles, and anything else you add. By
							posting it, you give us the license we need to store it and
							display it publicly at your profile URL, which is exactly what
							DevLinks is for.
						</p>
						<p>
							Your profile page is public by design. Don't post anything you
							don't want visible to anyone who finds your URL — we don't offer a
							way to make a profile private.
						</p>
						<p>
							You're responsible for what you post. Don't post content that:
						</p>
						<ul className="list-disc space-y-2 pl-5">
							<li>
								Is illegal, or infringes someone else's rights (copyright,
								trademark, privacy, or otherwise).
							</li>
							<li>
								Is malicious — phishing links, malware, or content designed to
								harm visitors.
							</li>
							<li>
								Impersonates another person or organization without
								authorization.
							</li>
							<li>
								Is spam, or exists mainly to manipulate search rankings or abuse
								another service's API through DevLinks.
							</li>
						</ul>
						<p>
							We can remove content or suspend accounts that violate this,
							without notice if the situation warrants it (active abuse, illegal
							content, security risk).
						</p>
					</Section>

					<Section title="Acceptable use">
						<ul className="list-disc space-y-2 pl-5">
							<li>
								Don't try to break, overload, or gain unauthorized access to
								DevLinks or another user's account.
							</li>
							<li>
								Don't scrape or bulk-extract data from DevLinks profiles beyond
								what a normal visitor sees in a browser.
							</li>
							<li>
								Don't use the connected-account integrations (Product Hunt,
								Dribbble, Pinterest, or any other) for anything other than
								displaying your own public content on your own profile.
							</li>
							<li>
								Don't reverse-engineer, decompile, or resell access to DevLinks
								itself.
							</li>
						</ul>
					</Section>

					<Section title="Plans and billing">
						<p>
							DevLinks offers a Free plan and a paid Pro plan ($5/month at the
							time of writing — see{" "}
							<a
								href="/#pricing"
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								Pricing
							</a>{" "}
							for current limits and features of each). Pro subscriptions are
							billed monthly in advance and processed by Dodo Payments, our
							payment processor — we never see or store your full card number.
						</p>
						<p>
							You can cancel your Pro subscription at any time; it stays active
							until the end of the billing period you already paid for, then
							your account reverts to the Free plan limits.{" "}
							<span className="italic">
								[Refund policy hasn't been formally defined — get this reviewed
								and stated explicitly before relying on it, e.g. whether
								partial-period refunds are ever offered.]
							</span>
						</p>
						<p>
							We may change our prices. If we do, we'll give existing
							subscribers notice before the change applies to their next billing
							cycle.
						</p>
					</Section>

					<Section title="Third-party integrations">
						<p>
							DevLinks displays data from services you connect — GitHub, GitLab,
							Dev.to, Product Hunt, and others. We don't control those services,
							their availability, or the accuracy of the data they return, and
							connecting one is also subject to that service's own terms. If a
							service changes its API or blocks access, the related feature on
							your profile may stop working until we (or they) fix it.
						</p>
					</Section>

					<Section title="Intellectual property">
						<p>
							The DevLinks name, design, and software are ours. These terms
							don't grant you any rights to them beyond using the service as
							intended. Your content remains yours, as described above.
						</p>
					</Section>

					<Section title="Termination">
						<p>
							You can stop using DevLinks at any time. To request deletion of
							your account and data, email{" "}
							<a
								href={`mailto:${CONTACT_EMAIL}`}
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								{CONTACT_EMAIL}
							</a>
							.
						</p>
						<p>
							We can suspend or terminate your account if you violate these
							terms, misuse the service, or if required by law. Where practical,
							we'll tell you why.
						</p>
					</Section>

					<Section title="Disclaimers">
						<p>
							DevLinks is provided "as is," without warranties of any kind. We
							don't guarantee the service will be uninterrupted, error-free, or
							available at all times.{" "}
							<span className="italic">
								[Standard SaaS disclaimer language — recommend legal review to
								confirm this holds up in the jurisdictions you actually serve.]
							</span>
						</p>
					</Section>

					<Section title="Limitation of liability">
						<p className="italic">
							[This section needs a lawyer, not a template. A typical SaaS
							limitation-of-liability clause caps damages at what a user paid in
							the last 12 months and excludes indirect/consequential damages —
							but the exact wording and enforceability depend on your
							jurisdiction and should be reviewed before you rely on it,
							especially once real payments are flowing through Dodo.]
						</p>
					</Section>

					<Section title="Changes to these terms">
						<p>
							If we make a material change, we'll update the effective date
							above and, for significant changes, notify you by email.
							Continuing to use DevLinks after a change takes effect means you
							accept the updated terms.
						</p>
					</Section>

					<Section title="Governing law">
						<p className="italic">
							[Governing law and jurisdiction haven't been formally chosen —
							this typically follows wherever the operating individual or entity
							is based. Fill in before relying on this section.]
						</p>
					</Section>

					<Section title="Contact">
						<p>
							Questions about these terms:{" "}
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
