import {
	BoltIcon,
	ChartSquareIcon,
	CodeSquareIcon,
	GlobeIcon,
	MagnifierIcon,
	PaletteIcon,
	StarsIcon,
} from "@solar-icons/react/linear";
import { GithubIcon } from "@/components/brand-icons";

const items = [
	{
		icon: GithubIcon,
		title: "GitHub-native",
		desc: "Pinned repos, stars, languages, contribution heatmap — synced automatically.",
	},
	{
		icon: CodeSquareIcon,
		title: "Snippets with style",
		desc: "Publish syntax-highlighted code. Tag, share, track views.",
	},
	{
		icon: PaletteIcon,
		title: "Theme builder",
		desc: "Tweak colors, fonts, radii and shadows. Drop in custom CSS on Pro.",
	},
	{
		icon: ChartSquareIcon,
		title: "Analytics that respect",
		desc: "See visits, clicks and CTR without cookies or third-party trackers.",
	},
	{
		icon: GlobeIcon,
		title: "Custom domain",
		desc: "Bring your own domain on Pro. SSL handled for you.",
	},
	{
		icon: MagnifierIcon,
		title: "Discoverable",
		desc: "Filter devs by language, stack, country and availability.",
	},
	{
		icon: StarsIcon,
		title: "Auto-imports",
		desc: "Dev.to, Hashnode, Medium RSS and Stack Overflow — all in sync.",
	},
	{
		icon: BoltIcon,
		title: "Built for speed",
		desc: "Edge-rendered, SEO-first, accessible by default.",
	},
];

export function Features() {
	return (
		<section id="features" className="border-t border-hairline">
			<div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
				<SectionHeader
					eyebrow="Features"
					title="Everything a developer profile should be."
					sub="The shortcuts you'd build yourself, polished and out of the way."
				/>
				<div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-hairline bg-hairline sm:grid-cols-2 lg:grid-cols-4">
					{items.map(({ icon: Icon, title, desc }) => (
						<div
							key={title}
							className="group flex flex-col gap-3 bg-background p-6 transition-colors hover:bg-surface"
						>
							<span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface text-foreground transition-colors group-hover:border-brand/40 group-hover:text-brand">
								<Icon size={16} />
							</span>
							<h3 className="text-sm font-medium">{title}</h3>
							<p className="text-sm text-muted-foreground">{desc}</p>
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
		<div className="mx-auto max-w-2xl text-center">
			<p className="font-mono text-xs uppercase tracking-widest text-brand">
				{eyebrow}
			</p>
			<h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
				{title}
			</h2>
			{sub && <p className="mt-3 text-pretty text-muted-foreground">{sub}</p>}
		</div>
	);
}
