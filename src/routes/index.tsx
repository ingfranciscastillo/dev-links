import { createFileRoute } from "@tanstack/react-router";
import { Cta } from "@/components/landing/cta";
import { Faq, faqs } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/")({
	head: () => {
		const orgId = absoluteUrl("/#organization");

		// @graph con lo que ya existe de verdad en la página: la copy de
		// Pricing.tsx (sin inventar aggregateRating, no hay reviews reales) y
		// las preguntas de Faq.tsx tal cual (mismo array, no una copia que
		// pueda desincronizarse).
		const jsonLd = {
			"@context": "https://schema.org",
			"@graph": [
				{
					"@type": "Organization",
					"@id": orgId,
					name: "DevLinks",
					url: absoluteUrl("/"),
					logo: absoluteUrl("/android-chrome-512.png"),
					sameAs: ["https://github.com/ingfranciscastillo"],
				},
				{
					"@type": "WebSite",
					"@id": absoluteUrl("/#website"),
					name: "DevLinks",
					url: absoluteUrl("/"),
					publisher: { "@id": orgId },
					potentialAction: {
						"@type": "SearchAction",
						target: {
							"@type": "EntryPoint",
							urlTemplate: absoluteUrl("/discover?q={search_term_string}"),
						},
						"query-input": "required name=search_term_string",
					},
				},
				{
					"@type": "SoftwareApplication",
					"@id": absoluteUrl("/#software"),
					name: "DevLinks",
					url: absoluteUrl("/"),
					applicationCategory: "DeveloperApplication",
					operatingSystem: "Web",
					offers: [
						{
							"@type": "Offer",
							name: "Free",
							price: "0",
							priceCurrency: "USD",
							availability: "https://schema.org/InStock",
						},
						{
							"@type": "Offer",
							name: "Pro",
							price: "5",
							priceCurrency: "USD",
							availability: "https://schema.org/InStock",
							priceSpecification: {
								"@type": "UnitPriceSpecification",
								price: "5",
								priceCurrency: "USD",
								unitText: "MONTH",
							},
						},
					],
				},
				{
					"@type": "FAQPage",
					"@id": absoluteUrl("/#faq"),
					mainEntity: faqs.map((faq) => ({
						"@type": "Question",
						name: faq.q,
						acceptedAnswer: {
							"@type": "Answer",
							text: faq.a,
						},
					})),
				},
			],
		};

		return {
			meta: [
				{ title: "DevLinks — The link-in-bio built for developers" },
				{
					name: "description",
					content:
						"Your repos, snippets, articles and projects on one page — auto-synced with GitHub, Dev.to, Medium and Stack Overflow.",
				},
				{
					property: "og:title",
					content: "DevLinks — The link-in-bio for developers",
				},
				{
					property: "og:description",
					content:
						"One page for everything you ship. Built for developers, with the polish of Linear and the speed of Vercel.",
				},
				{ property: "og:url", content: absoluteUrl("/") },
				// Built-in JSON-LD support: renders a correctly-typed
				// <script type="application/ld+json"> with safe escaping — see
				// the same pattern/comment in routes/$username.tsx. A flat
				// `scripts: [{ attrs, children }]` entry gets misassembled into
				// a nested `attrs.attrs`, losing the `type` attr.
				{ "script:ld+json": jsonLd },
			],
			links: [{ rel: "canonical", href: absoluteUrl("/") }],
		};
	},
	component: Landing,
});

function Landing() {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />
			<main>
				<Hero />
				<Features />
				<Pricing />
				<Faq />
				<Cta />
			</main>
			<Footer />
		</div>
	);
}
