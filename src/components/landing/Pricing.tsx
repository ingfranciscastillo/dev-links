import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import { motion, useReducedMotion } from "motion/react";

import { SectionHeader } from "./Features";

const rows = [
	["All integrations", "All", "All"],
	["Connected sources", "Up to 5", "Unlimited"],
	["Sync frequency", "Daily", "Frequent"],
	["Links", "Up to 5", "Unlimited"],
	["Projects", "Up to 5", "Unlimited"],
	["Snippets", "Up to 5", "Unlimited"],
	["Basic themes", "Included", "Included"],
	["Analytics", "—", "Included"],
	["Custom CSS", "—", "Included"],
	["DevLinks branding", "Included", "Removed"],
	["Priority support", "—", "Included"],
];

const plans = [
	{
		name: "Free",
		price: "$0",
		sub: "forever",
		cta: "Start free",
		href: "/#cta",
	},
	{
		name: "Pro",
		price: "$5",
		sub: "per month",
		cta: "Go Pro",
		href: "/#cta",
	},
];

const ease = [0.16, 1, 0.3, 1] as const;

export function Pricing() {
	const reduceMotion = useReducedMotion();

	return (
		<section id="pricing" className="border-t border-border">
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
						eyebrow="04 / Pricing"
						title="Free forever. Pro when you need more."
						sub="Start with everything you need to build your developer presence. Upgrade when you want more control."
					/>
				</motion.div>

				<motion.div
					className="mt-16 border-t border-border sm:mt-20"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.08 }}
					variants={{
						hidden: {},
						visible: {
							transition: {
								staggerChildren: reduceMotion ? 0 : 0.055,
							},
						},
					}}
				>
					<motion.div
						variants={{
							hidden: reduceMotion ? {} : { opacity: 0, y: 12 },
							visible: {
								opacity: 1,
								y: 0,
								transition: {
									duration: reduceMotion ? 0.01 : 0.5,
									ease,
								},
							},
						}}
						className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] border-b border-border py-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:grid-cols-[minmax(0,1fr)_10rem_10rem]"
					>
						<span>Feature</span>

						{plans.map((plan) => (
							<div key={plan.name} className="text-right">
								<div className="text-foreground">{plan.name}</div>

								<div className="mt-1 normal-case tracking-normal">
									{plan.price} · {plan.sub}
								</div>
							</div>
						))}
					</motion.div>

					{rows.map(([label, free, pro], index) => (
						<motion.div
							key={label}
							variants={{
								hidden: reduceMotion
									? {}
									: {
											opacity: 0,
											y: 12,
										},
								visible: {
									opacity: 1,
									y: 0,
									transition: {
										duration: reduceMotion ? 0.01 : 0.45,
										ease,
									},
								},
							}}
							className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] items-center border-b border-border py-5 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]"
						>
							<div className="flex min-w-0 items-baseline gap-3">
								<span className="shrink-0 font-mono text-[9px] text-muted-foreground">
									{String(index + 1).padStart(2, "0")}
								</span>

								<span className="truncate text-sm">{label}</span>
							</div>

							<span className="text-right text-sm text-muted-foreground">
								{free}
							</span>

							<span className="text-right text-sm text-foreground">{pro}</span>
						</motion.div>
					))}

					<motion.div
						variants={{
							hidden: reduceMotion ? {} : { opacity: 0, y: 12 },
							visible: {
								opacity: 1,
								y: 0,
								transition: {
									duration: reduceMotion ? 0.01 : 0.5,
									ease,
								},
							},
						}}
						className="grid grid-cols-[minmax(0,1fr)_7rem_7rem] py-6 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]"
					>
						<div />

						<a
							href="/#cta"
							className="group col-span-2 inline-flex w-fit justify-self-end items-center gap-2 border border-foreground px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors hover:border-brand hover:text-brand"
						>
							Choose a plan
							<ArrowRightIcon
								size={13}
								className="transition-transform duration-300 group-hover:translate-x-1"
							/>
						</a>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
