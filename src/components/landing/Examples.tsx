import { ArrowRightUpIcon } from "@solar-icons/react/linear/arrow-right-up";
import { Link } from "@tanstack/react-router";

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

export function Examples() {
	return (
		<section id="examples" className="border-t border-border">
			<div className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<SectionHeader
					eyebrow="03 / Examples"
					title="See DevLinks in the wild."
					sub="Different people. Different stacks. Same address."
				/>

				<div className="mt-16 border-t border-border sm:mt-20">
					{examples.map((example, index) => (
						<Link
							key={example.handle}
							to="/$username"
							params={{ username: example.handle }}
							className="group grid gap-5 border-b border-border py-7 transition-colors hover:bg-surface sm:grid-cols-[4rem_minmax(0,1fr)_20rem_2rem] sm:items-center sm:px-3 sm:py-8"
						>
							<span className="font-mono text-[10px] tracking-[0.08em] text-muted-foreground">
								{String(index + 1).padStart(2, "0")}
							</span>

							<div>
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
					))}
				</div>
			</div>
		</section>
	);
}
