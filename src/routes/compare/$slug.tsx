import { ArrowRightIcon } from "@solar-icons/react/linear";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { COMPARISONS, getComparison } from "@/lib/comparisons";
import { absoluteUrl } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

export const Route = createFileRoute("/compare/$slug")({
	loader: ({ params }) => {
		const comparison = getComparison(params.slug);
		if (!comparison) throw notFound();
		return comparison;
	},
	head: ({ loaderData, params }) => {
		if (!loaderData) return {};
		// headline is already "DevLinks vs. X" — appending "— DevLinks" duplicated
		// the brand name in the title tag.
		const title = loaderData.headline;
		return {
			meta: [
				{ title },
				{ name: "description", content: loaderData.metaDescription },
				{ property: "og:title", content: title },
				{ property: "og:description", content: loaderData.metaDescription },
			],
			links: [
				{ rel: "canonical", href: absoluteUrl(`/compare/${params.slug}`) },
			],
		};
	},
	notFoundComponent: () => (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4">
			<div className="text-center">
				<h1 className="text-3xl font-semibold tracking-tight">
					Comparison not found
				</h1>
				<Link
					to="/compare"
					className="mt-6 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
				>
					See all comparisons
				</Link>
			</div>
		</div>
	),
	component: ComparePage,
});

function ComparePage() {
	const comparison = Route.useLoaderData();
	const others = COMPARISONS.filter((c) => c.slug !== comparison.slug);
	const reduceMotion = useReducedMotion();

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<motion.div
					initial={reduceMotion ? false : { opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: reduceMotion ? 0.01 : 0.7, ease }}
				>
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
						Comparisons
					</p>

					<h1 className="mt-6 max-w-3xl font-display text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl">
						{comparison.headline}
					</h1>

					<p className="mt-6 max-w-xl text-sm leading-relaxed text-muted-foreground">
						{comparison.intro}
					</p>
				</motion.div>

				<motion.div
					className="mt-16 border-t border-border"
					initial={reduceMotion ? false : { opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.2 }}
					transition={{ duration: reduceMotion ? 0.01 : 0.6, ease }}
				>
					<div className="grid grid-cols-[minmax(0,1fr)_1fr_1fr] gap-4 border-b border-border py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
						<span>Feature</span>
						<span className="text-foreground">DevLinks</span>
						<span>{comparison.competitor}</span>
					</div>

					{comparison.rows.map((row) => (
						<div
							key={row.label}
							className="grid grid-cols-[minmax(0,1fr)_1fr_1fr] items-start gap-4 border-b border-border py-5"
						>
							<span className="text-sm">{row.label}</span>
							<span className="text-sm text-foreground">{row.devlinks}</span>
							<span className="text-sm text-muted-foreground">
								{row.competitor}
							</span>
						</div>
					))}
				</motion.div>

				<div className="mt-16 grid gap-8 border-t border-border pt-10 sm:grid-cols-2">
					<div>
						<h2 className="font-display text-xl tracking-tight">
							When {comparison.competitor} fits better
						</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							{comparison.whenTheyFit}
						</p>
					</div>
					<div>
						<h2 className="font-display text-xl tracking-tight">
							When DevLinks fits better
						</h2>
						<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
							{comparison.whenDevlinksFits}
						</p>
					</div>
				</div>

				<div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-10">
					<a
						href="/#cta"
						className="group inline-flex items-center gap-2 border border-foreground px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
					>
						Claim your profile
						<ArrowRightIcon
							size={13}
							className="transition-transform duration-300 group-hover:translate-x-1"
						/>
					</a>

					<div className="flex flex-wrap gap-4">
						{others.map((c) => (
							<Link
								key={c.slug}
								to="/compare/$slug"
								params={{ slug: c.slug }}
								className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
							>
								vs. {c.competitor}
							</Link>
						))}
					</div>
				</div>
			</main>

			<Footer />
		</div>
	);
}
