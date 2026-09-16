import { ArrowRightIcon } from "@solar-icons/react/linear";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { COMPARISONS } from "@/lib/comparisons";
import { absoluteUrl } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

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

					<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
						How DevLinks compares.
					</h1>

					<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
						Honest, feature-by-feature comparisons — including when the other
						option is genuinely the better fit.
					</p>
				</motion.div>

				<motion.div
					className="mt-16 border-t border-border"
					initial="hidden"
					animate="visible"
					variants={{
						hidden: {},
						visible: {
							transition: { staggerChildren: reduceMotion ? 0 : 0.08, delayChildren: reduceMotion ? 0 : 0.2 },
						},
					}}
				>
					{COMPARISONS.map((c) => (
						<motion.div
							key={c.slug}
							variants={{
								hidden: reduceMotion ? {} : { opacity: 0, y: 16 },
								visible: {
									opacity: 1,
									y: 0,
									transition: { duration: reduceMotion ? 0.01 : 0.5, ease },
								},
							}}
						>
							<Link
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
						</motion.div>
					))}
				</motion.div>
			</main>

			<Footer />
		</div>
	);
}
