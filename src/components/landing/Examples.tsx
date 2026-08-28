import { ArrowRightUpIcon } from "@solar-icons/react/linear/arrow-right-up";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";

import { SectionHeader } from "./Features";

const examples = [
	{
		handle: "francis",
		name: "Francis Dev",
		role: "Frontend Developer · Product Builder",
	},
	{
		handle: "ada",
		name: "Ada Park",
		role: "Rust · Systems · Open Source",
	},
	{
		handle: "kenji",
		name: "Kenji Sato",
		role: "Developer Experience · Tooling",
	},
];

const ease = [0.16, 1, 0.3, 1] as const;

export function Examples() {
	const reduceMotion = useReducedMotion();

	return (
		<section id="examples" className="border-t border-border">
			<div className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<motion.div
					initial={reduceMotion ? false : { opacity: 0, y: 18 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.35 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.7,
						ease,
					}}
				>
					<SectionHeader
						eyebrow="03 / Examples"
						title="See DevLinks in the wild."
						sub="Different people. Different stacks. Same address."
					/>
				</motion.div>

				<motion.div
					className="mt-16 border-t border-border sm:mt-20"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.15 }}
					variants={{
						hidden: {},
						visible: {
							transition: {
								staggerChildren: reduceMotion ? 0 : 0.1,
							},
						},
					}}
				>
					{examples.map((example, index) => (
						<motion.div
							key={example.handle}
							variants={{
								hidden: reduceMotion
									? {}
									: {
											opacity: 0,
											y: 18,
										},
								visible: {
									opacity: 1,
									y: 0,
									transition: {
										duration: reduceMotion ? 0.01 : 0.55,
										ease,
									},
								},
							}}
						>
							<Link
								to="/$username"
								params={{ username: example.handle }}
								className="group grid gap-5 border-b border-border py-7 transition-colors hover:bg-surface sm:grid-cols-[4rem_minmax(0,1fr)_20rem_2rem] sm:items-center sm:px-3 sm:py-8"
							>
								<span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
									{String(index + 1).padStart(2, "0")}
								</span>

								<div className="min-w-0">
									<h3 className="font-display text-2xl tracking-tight sm:text-3xl">
										{example.name}
									</h3>

									<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
										@{example.handle}
									</p>
								</div>

								<p className="text-sm text-muted-foreground">{example.role}</p>

								<ArrowRightUpIcon
									width={16}
									height={16}
									className="text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-brand"
								/>
							</Link>
						</motion.div>
					))}
				</motion.div>
			</div>
		</section>
	);
}
