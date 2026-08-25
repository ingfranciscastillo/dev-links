import { CheckCircleIcon } from "@solar-icons/react/line-duotone";
import { SectionHeader } from "./Features";

const plans = [
	{
		name: "Free",
		price: "$0",
		sub: "For trying it out",
		features: [
			"devlinks.com subdomain",
			"Up to 10 links",
			"Up to 5 projects",
			"Up to 5 snippets",
			"Basic themes",
			"GitHub auto-sync",
		],
		cta: "Start free",
		href: "/#cta",
		featured: false,
	},
	{
		name: "Pro",
		price: "$5",
		sub: "per month",
		features: [
			"Custom domain",
			"Unlimited links, projects & snippets",
			"Full analytics dashboard",
			"Premium themes + custom CSS",
			"Remove watermark",
			"Priority support",
		],
		cta: "Go Pro",
		href: "/#cta",
		featured: true,
	},
];

export function Pricing() {
	return (
		<section id="pricing" className="border-t border-hairline">
			<div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
				<SectionHeader
					eyebrow="Pricing"
					title="Free forever. Pro when you're ready."
				/>
				<div className="mx-auto mt-12 grid max-w-3xl gap-4 md:grid-cols-2">
					{plans.map((p) => (
						<div
							key={p.name}
							className={`relative flex flex-col rounded-2xl border p-6 ${
								p.featured
									? "border-brand/40 bg-surface shadow-glow"
									: "border-hairline bg-background"
							}`}
						>
							{p.featured && (
								<span className="absolute -top-2.5 left-6 inline-flex items-center rounded-full border border-brand/40 bg-background px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-brand">
									Recommended
								</span>
							)}
							<div className="flex items-baseline justify-between">
								<h3 className="text-lg font-semibold tracking-tight">
									{p.name}
								</h3>
								<div className="flex items-baseline gap-1">
									<span className="text-3xl font-semibold tracking-tight">
										{p.price}
									</span>
									<span className="text-xs text-muted-foreground">{p.sub}</span>
								</div>
							</div>
							<ul className="mt-6 space-y-2.5 text-sm">
								{p.features.map((f) => (
									<li key={f} className="flex items-center gap-2.5">
										<CheckCircleIcon
											size={20}
											secondaryOpacity={0}
											className="mt-0.5 shrink-0 text-brand"
										/>
										<span className="text-muted-foreground">{f}</span>
									</li>
								))}
							</ul>
							<a
								href={p.href}
								className={`mt-8 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-opacity ${
									p.featured
										? "bg-foreground text-background hover:opacity-90"
										: "border border-border bg-surface hover:bg-surface-elevated"
								}`}
							>
								{p.cta}
							</a>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
