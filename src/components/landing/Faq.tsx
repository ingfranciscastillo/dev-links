import { motion, useReducedMotion } from "motion/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";

import { SectionHeader } from "./Features";

const faqs = [
	{
		q: "Is DevLinks really free?",
		a: "Yes. The Free plan covers a public profile, GitHub sync, up to 10 links, 5 projects and 5 snippets. Forever.",
	},
	{
		q: "What gets imported automatically?",
		a: "Your GitHub repos and contributions, Dev.to articles, Hashnode posts, a Medium RSS feed, and Stack Overflow stats. All refreshed in the background.",
	},
	{
		q: "Do you track my visitors with third-party cookies?",
		a: "No. Analytics is first-party, cookieless, and aggregated. Visitors stay anonymous.",
	},
	{
		q: "Can I customise the look?",
		a: "Every plan gets the theme builder (colors, fonts, radii, shadows). Pro adds premium themes and a custom CSS panel.",
	},
	{
		q: "Can I cancel anytime?",
		a: "Yes — one click. Your profile stays online on the Free plan with Free-tier limits.",
	},
];

const ease = [0.16, 1, 0.3, 1] as const;

export function Faq() {
	const reduceMotion = useReducedMotion();

	return (
		<section id="faq" className="border-t border-border">
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
					<SectionHeader eyebrow="05 / FAQ" title="Questions, answered." />
				</motion.div>

				<motion.div
					className="mt-16 max-w-3xl border-t border-border sm:mt-20"
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.12 }}
					variants={{
						hidden: {},
						visible: {
							transition: {
								staggerChildren: reduceMotion ? 0 : 0.08,
							},
						},
					}}
				>
					<Accordion type="single" collapsible>
						{faqs.map((faq, index) => (
							<motion.div
								key={faq.q}
								variants={{
									hidden: reduceMotion
										? {}
										: {
												opacity: 0,
												y: 14,
											},
									visible: {
										opacity: 1,
										y: 0,
										transition: {
											duration: reduceMotion ? 0.01 : 0.5,
											ease,
										},
									},
								}}
							>
								<AccordionItem
									value={`item-${index}`}
									className="border-b border-border"
								>
									<AccordionTrigger className="group py-6 text-left font-display text-xl tracking-[-0.02em] hover:no-underline sm:py-7 sm:text-2xl">
										<span className="flex min-w-0 items-start gap-4 pr-4">
											<span className="shrink-0 pt-1 font-mono text-[9px] tracking-[0.08em] text-muted-foreground">
												{String(index + 1).padStart(2, "0")}
											</span>

											<span className="min-w-0">{faq.q}</span>
										</span>
									</AccordionTrigger>

									<AccordionContent className="pb-7 pl-8 text-sm leading-relaxed text-muted-foreground sm:pb-8">
										<div className="max-w-2xl">{faq.a}</div>
									</AccordionContent>
								</AccordionItem>
							</motion.div>
						))}
					</Accordion>
				</motion.div>
			</div>
		</section>
	);
}
