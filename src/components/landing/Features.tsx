const items = [
	{
		title: "GitHub-native",
		desc: "Your repositories, activity and profile, kept in sync.",
	},
	{
		title: "Snippets",
		desc: "Publish syntax-highlighted code directly from your profile.",
	},
	{
		title: "Theme builder",
		desc: "Make the profile feel like yours, down to the smallest detail.",
	},
	{
		title: "Analytics",
		desc: "Useful numbers without cookies or third-party trackers.",
	},
	{
		title: "Custom domains",
		desc: "Use your own domain with SSL handled for you.",
	},
	{
		title: "Discover",
		desc: "Help people find developers by stack, language and availability.",
	},
	{
		title: "Auto-imports",
		desc: "Bring writing and activity from the platforms you already use.",
	},
	{
		title: "Built for speed",
		desc: "Fast, accessible and SEO-first from the start.",
	},
];

export function Features() {
	return (
		<section id="features" className="border-t border-border">
			<div className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<SectionHeader
					eyebrow="02 / Features"
					title="A developer profile, without the maintenance."
					sub="Everything you normally wire together yourself, kept in one place and quietly updated."
				/>

				<div className="mt-16 border-t border-border sm:mt-20">
					{items.map(({ title, desc }, index) => (
						<div
							key={title}
							className="group grid gap-5 border-b border-border py-7 transition-colors hover:bg-surface sm:grid-cols-[4rem_minmax(0,1fr)_minmax(16rem,24rem)_2rem] sm:items-start sm:px-3 sm:py-8"
						>
							<span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
								{String(index + 1).padStart(2, "0")}
							</span>

							<h3 className="font-display text-2xl tracking-tight sm:text-3xl">
								{title}
							</h3>

							<p className="max-w-md text-sm leading-relaxed text-muted-foreground sm:pt-1">
								{desc}
							</p>

							<span
								aria-hidden="true"
								className="hidden font-mono text-xs text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand sm:block"
							>
								↗
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

export function SectionHeader({
	eyebrow,
	title,
	sub,
}: {
	eyebrow: string;
	title: string;
	sub?: string;
}) {
	return (
		<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
			<div>
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					{eyebrow}
				</p>

				<h2 className="mt-5 max-w-4xl font-display text-[11vw] leading-[0.92] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
					{title}
				</h2>
			</div>

			{sub && (
				<p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground lg:justify-self-end lg:pb-1">
					{sub}
				</p>
			)}
		</div>
	);
}
