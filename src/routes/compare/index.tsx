import { ArrowRightIcon } from "@solar-icons/react/linear";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { COMPARISONS } from "@/lib/comparisons";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/compare/")({
	head: () => ({
		meta: [
			{ title: "DevLinks vs. the alternatives — Comparisons" },
			{
				name: "description",
				content:
					"How DevLinks compares to Linktree, Bento, and a GitHub README or DIY portfolio — honestly, feature by feature.",
			},
		],
		links: [{ rel: "canonical", href: absoluteUrl("/compare") }],
	}),
	component: CompareIndex,
});

function CompareIndex() {
	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Comparisons
				</p>

				<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					How DevLinks compares.
				</h1>

				<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
					Honest, feature-by-feature comparisons — including when the other
					option is genuinely the better fit.
				</p>

				<div className="mt-16 border-t border-border">
					{COMPARISONS.map((c) => (
						<Link
							key={c.slug}
							to="/compare/$slug"
							params={{ slug: c.slug }}
							className="group flex items-center justify-between gap-4 border-b border-border py-6 transition-colors hover:bg-surface"
						>
							<div>
								<h2 className="font-display text-2xl tracking-tight sm:text-3xl">
									{c.headline}
								</h2>
								<p className="mt-1 max-w-lg text-sm text-muted-foreground">
									{c.intro}
								</p>
							</div>
							<ArrowRightIcon
								size={18}
								className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand"
							/>
						</Link>
					))}
				</div>
			</main>

			<Footer />
		</div>
	);
}
