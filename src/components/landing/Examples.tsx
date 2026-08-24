import { ArrowRightUpIcon } from "@solar-icons/react/linear/arrow-right-up";
import { Link } from "@tanstack/react-router";
import { SectionHeader } from "./Features";

const examples = [
	{
		handle: "francis",
		name: "Francis Dev",
		role: "Senior Engineer · Vercel",
		color: "from-brand to-brand/30",
	},
	{
		handle: "ada",
		name: "Ada Park",
		role: "Rust + Systems · Cloudflare",
		color: "from-amber-500 to-rose-500/40",
	},
	{
		handle: "kenji",
		name: "Kenji Sato",
		role: "DX Engineer · Linear",
		color: "from-emerald-500 to-teal-500/40",
	},
];

export function Examples() {
	return (
		<section id="examples" className="border-t border-hairline bg-surface/40">
			<div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
				<SectionHeader
					eyebrow="Examples"
					title="Profiles that look made for the web."
					sub="Three live pages built with DevLinks."
				/>
				<div className="mt-12 grid gap-4 md:grid-cols-3">
					{examples.map((e) => (
						<Link
							key={e.handle}
							to="/$username"
							params={{ username: e.handle }}
							className="group overflow-hidden rounded-xl border border-hairline bg-background transition-colors hover:bg-surface-elevated"
						>
							<div className={`relative h-28 bg-gradient-to-br ${e.color}`}>
								<div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.18),transparent_50%)]" />
							</div>
							<div className="-mt-8 px-5 pb-5">
								<div className="h-14 w-14 rounded-full border-4 border-background bg-surface" />
								<div className="mt-3 flex items-start justify-between">
									<div>
										<p className="font-semibold tracking-tight">{e.name}</p>
										<p className="text-xs text-muted-foreground">
											@{e.handle} · {e.role}
										</p>
									</div>
									<ArrowRightUpIcon
										width={16}
										height={16}
										className="text-muted-foreground transition-colors group-hover:text-foreground"
									/>
								</div>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
