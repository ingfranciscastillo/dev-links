import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

const ease = [0.16, 1, 0.3, 1] as const;

export function Footer() {
	const reduceMotion = useReducedMotion();

	return (
		<footer className="border-t border-border">
			<div className="mx-auto max-w-editorial px-5 py-16 sm:px-8 sm:py-20">
				<div className="grid gap-12 md:grid-cols-[minmax(0,1.5fr)_1fr_1fr] md:gap-16">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.3 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.6,
							ease,
						}}
					>
						<Link to="/" className="font-display text-2xl tracking-[-0.03em]">
							DevLinks
						</Link>

						<p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
							A developer profile for your work, writing, projects, and
							everything you want people to find.
						</p>

						<p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
							Developer identity, in one address.
						</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.3 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.6,
							delay: 0.08,
							ease,
						}}
					>
						<FooterCol
							title="Product"
							items={[
								{ label: "Features", href: "/#features" },
								{ label: "Examples", href: "/#examples" },
								{ label: "Pricing", href: "/#pricing" },
								{ label: "Discover", href: "/discover" },
							]}
						/>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.3 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.6,
							delay: 0.16,
							ease,
						}}
					>
						<FooterCol
							title="Elsewhere"
							items={[
								{ label: "GitHub", href: "https://github.com" },
								{ label: "X", href: "https://x.com" },
								{ label: "Changelog", href: "#" },
								{ label: "Privacy", href: "#" },
							]}
						/>
					</motion.div>
				</div>

				<motion.div
					className="mt-16 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between"
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true, amount: 0.3 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.5,
						delay: 0.24,
						ease,
					}}
				>
					<p className="text-xs text-muted-foreground">
						© {new Date().getFullYear()} DevLinks. Built for developers.
					</p>

					<p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
						v0.1.0
					</p>
				</motion.div>
			</div>
		</footer>
	);
}

function FooterCol({
	title,
	items,
}: {
	title: string;
	items: { label: string; href: string }[];
}) {
	return (
		<div>
			<h4 className="font-mono text-[10px] uppercase tracking-[0.12em] text-brand">
				{title}
			</h4>

			<ul className="mt-5 space-y-3">
				{items.map((item) => (
					<li key={item.label}>
						<a
							href={item.href}
							className="group inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{item.label}

							{item.href.startsWith("http") && (
								<ArrowRightUpIcon
									size={12}
									className="opacity-0 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100"
								/>
							)}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}
