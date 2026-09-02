import { createFileRoute } from "@tanstack/react-router";
import { Cta } from "@/components/landing/cta";
import { Examples } from "@/components/landing/Examples";
import { Faq } from "@/components/landing/Faq";
import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { Pricing } from "@/components/landing/Pricing";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/")({
	head: () => ({
		meta: [
			{ title: "DevLinks — The link-in-bio built for developers" },
			{
				name: "description",
				content:
					"Your repos, snippets, articles and projects on one page — auto-synced with GitHub, Dev.to, Hashnode, Medium and Stack Overflow.",
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
		],
		links: [{ rel: "canonical", href: absoluteUrl("/") }],
	}),
	component: Landing,
});

function Landing() {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />
			<main>
				<Hero />
				<Features />
				<Examples />
				<Pricing />
				<Faq />
				<Cta />
			</main>
			<Footer />
		</div>
	);
}
