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
		q: "Can I use my own domain?",
		a: "On Pro you can connect any domain. We handle SSL automatically.",
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

export function Faq() {
	return (
		<section id="faq" className="border-t border-hairline bg-surface/40">
			<div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 sm:py-28">
				<SectionHeader eyebrow="FAQ" title="Questions, answered." />
				<Accordion type="single" collapsible className="mt-10">
					{faqs.map((f, i) => (
						<AccordionItem
							key={i}
							value={`item-${i}`}
							className="border-hairline"
						>
							<AccordionTrigger className="text-left text-base hover:no-underline">
								{f.q}
							</AccordionTrigger>
							<AccordionContent className="text-muted-foreground">
								{f.a}
							</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</section>
	);
}
