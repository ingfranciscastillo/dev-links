import {
	Buildings2Icon,
	GlobeIcon,
	MapPointIcon,
	StarIcon,
} from "@solar-icons/react/linear";
import type { SVGProps } from "react";
import { GithubIcon, XIcon } from "@/components/brand-icons";

function GitBranchIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			strokeLinecap="round"
			strokeLinejoin="round"
			{...props}
		>
			<line x1="6" y1="3" x2="6" y2="15" />
			<circle cx="18" cy="6" r="3" />
			<circle cx="6" cy="18" r="3" />
			<path d="M18 9a9 9 0 0 1-9 9" />
		</svg>
	);
}

export function ProfilePreview() {
	return (
		<div className="overflow-hidden rounded-2xl border border-hairline bg-surface shadow-card">
			<div className="flex items-center gap-1.5 border-b border-hairline px-4 py-3">
				<span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
				<span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
				<span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
				<span className="ml-3 font-mono text-xs text-muted-foreground">
					devlinks.com/francis
				</span>
			</div>

			<div className="grid gap-6 p-6 md:grid-cols-[1fr_1.2fr]">
				<div>
					<div className="flex items-start gap-4">
						<div className="h-16 w-16 shrink-0 rounded-full bg-gradient-to-br from-brand to-brand/40 ring-2 ring-hairline" />
						<div>
							<h3 className="text-lg font-semibold tracking-tight">
								Francis Dev
							</h3>
							<p className="text-sm text-muted-foreground">
								@francis · Senior Engineer
							</p>
							<span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-background px-2 py-0.5 text-xs">
								<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
								Available for hire
							</span>
						</div>
					</div>
					<p className="mt-4 text-sm text-muted-foreground">
						Full-stack engineer building developer tools. Rust, TypeScript and
						Postgres.
					</p>
					<ul className="mt-4 space-y-2 text-sm text-muted-foreground">
						<li className="flex items-center gap-2">
							<Buildings2Icon size={14} /> Vercel
						</li>
						<li className="flex items-center gap-2">
							<MapPointIcon size={14} /> Madrid, Spain
						</li>
						<li className="flex items-center gap-2">
							<GlobeIcon size={14} /> francis.dev
						</li>
					</ul>
					<div className="mt-4 flex gap-2">
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-background">
							<GithubIcon size={14} />
						</span>
						<span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-hairline bg-background">
							<XIcon size={14} />
						</span>
					</div>
				</div>

				<div className="space-y-3">
					{[
						{
							name: "next-shadcn-starter",
							desc: "Production-ready Next.js + shadcn template",
							lang: "TypeScript",
							stars: 1240,
						},
						{
							name: "rust-rate-limiter",
							desc: "Tiny token-bucket limiter for axum",
							lang: "Rust",
							stars: 412,
						},
						{
							name: "pg-snapshot",
							desc: "Logical replication snapshots for Postgres",
							lang: "Go",
							stars: 198,
						},
					].map((r) => (
						<div
							key={r.name}
							className="rounded-lg border border-hairline bg-background p-3 transition-colors hover:bg-surface-elevated"
						>
							<div className="flex items-center justify-between">
								<span className="font-mono text-sm font-medium">{r.name}</span>
								<span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
									<StarIcon size={12} /> {r.stars}
								</span>
							</div>
							<p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
							<div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
								<span className="inline-flex items-center gap-1.5">
									<span className="h-2 w-2 rounded-full bg-brand" />
									{r.lang}
								</span>
								<span className="inline-flex items-center gap-1">
									<GitBranchIcon width={12} height={12} /> main
								</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
