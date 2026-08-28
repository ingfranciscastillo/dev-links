import {
	Buildings2Icon,
	GlobeIcon,
	MapPointIcon,
	StarIcon,
} from "@solar-icons/react/linear";
import { motion, useReducedMotion } from "motion/react";
import type { SVGProps } from "react";

import { GithubIcon, XIcon } from "@/components/brand-icons";

const ease = [0.16, 1, 0.3, 1] as const;

function GitBranchIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 24 24"
			aria-hidden="true"
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

const repositories = [
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
];

export function ProfilePreview() {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.985 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={{
				duration: reduceMotion ? 0.01 : 0.9,
				ease,
			}}
			className="overflow-hidden bg-background"
		>
			{/* Browser chrome */}
			<motion.div
				initial={reduceMotion ? false : { opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{
					duration: reduceMotion ? 0.01 : 0.4,
					delay: reduceMotion ? 0 : 0.15,
					ease,
				}}
				className="flex items-center justify-between border-b border-border px-4 py-3"
			>
				<div className="flex items-center gap-1.5">
					<span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
					<span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
					<span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
				</div>

				<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
					devlinks.com/francis
				</span>

				<span className="w-8" aria-hidden="true" />
			</motion.div>

			<div className="grid lg:grid-cols-[0.8fr_1.2fr]">
				{/* Identity */}
				<motion.div
					initial={reduceMotion ? false : { opacity: 0, x: -18 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.65,
						delay: reduceMotion ? 0 : 0.18,
						ease,
					}}
					className="border-b border-border p-6 sm:p-8 lg:border-b-0 lg:border-r"
				>
					<div className="flex items-start gap-4">
						<motion.div
							initial={reduceMotion ? false : { opacity: 0, scale: 0.85 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								duration: reduceMotion ? 0.01 : 0.5,
								delay: reduceMotion ? 0 : 0.3,
								ease,
							}}
							className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-display text-xl text-brand"
						>
							F
						</motion.div>

						<div className="min-w-0">
							<h3 className="font-display text-2xl tracking-[-0.03em]">
								Francis Dev
							</h3>

							<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
								@francis · Senior Engineer
							</p>
						</div>
					</div>

					<motion.div
						initial={reduceMotion ? false : { opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.45,
							delay: reduceMotion ? 0 : 0.38,
							ease,
						}}
						className="mt-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-brand"
					>
						<span className="h-1.5 w-1.5 rounded-full bg-brand" />
						Available for hire
					</motion.div>

					<motion.p
						initial={reduceMotion ? false : { opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.45,
							delay: reduceMotion ? 0 : 0.44,
							ease,
						}}
						className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground"
					>
						Full-stack engineer building developer tools. Rust, TypeScript and
						Postgres.
					</motion.p>

					<motion.div
						initial={reduceMotion ? false : { opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.45,
							delay: reduceMotion ? 0 : 0.5,
							ease,
						}}
						className="mt-6 space-y-3 border-t border-border pt-5"
					>
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Buildings2Icon size={14} />
							<span>Vercel</span>
						</div>

						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<MapPointIcon size={14} />
							<span>Madrid, Spain</span>
						</div>

						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<GlobeIcon size={14} />
							<span>francis.dev</span>
						</div>
					</motion.div>

					<motion.div
						initial={reduceMotion ? false : { opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.45,
							delay: reduceMotion ? 0 : 0.56,
							ease,
						}}
						className="mt-6 flex items-center gap-4"
					>
						<a
							href="https://github.com"
							aria-label="GitHub"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							<GithubIcon size={15} />
						</a>

						<a
							href="https://x.com"
							aria-label="X"
							className="text-muted-foreground transition-colors hover:text-foreground"
						>
							<XIcon size={15} />
						</a>
					</motion.div>
				</motion.div>

				{/* Repositories */}
				<motion.div
					initial={reduceMotion ? false : { opacity: 0, x: 18 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.65,
						delay: reduceMotion ? 0 : 0.24,
						ease,
					}}
					className="p-6 sm:p-8"
				>
					<div className="mb-4 flex items-center justify-between border-b border-border pb-3">
						<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
							Selected repositories
						</p>

						<p className="font-mono text-[10px] tabular-nums text-muted-foreground">
							03
						</p>
					</div>

					<div>
						{repositories.map((repo, index) => (
							<motion.div
								key={repo.name}
								initial={reduceMotion ? false : { opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{
									duration: reduceMotion ? 0.01 : 0.5,
									delay: reduceMotion ? 0 : 0.36 + index * 0.08,
									ease,
								}}
								className="group border-b border-border py-4 last:border-b-0"
							>
								<div className="flex items-start gap-4">
									<span className="font-mono text-[10px] tabular-nums text-muted-foreground">
										0{index + 1}
									</span>

									<div className="min-w-0 flex-1">
										<div className="flex items-start justify-between gap-4">
											<span className="font-mono text-sm font-medium text-foreground">
												{repo.name}
											</span>

											<span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] tabular-nums text-muted-foreground">
												<StarIcon size={11} />
												{repo.stars}
											</span>
										</div>

										<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
											{repo.desc}
										</p>

										<div className="mt-3 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.04em] text-muted-foreground">
											<span className="inline-flex items-center gap-1.5">
												<span className="h-1.5 w-1.5 rounded-full bg-brand" />
												{repo.lang}
											</span>

											<span className="inline-flex items-center gap-1">
												<GitBranchIcon width={11} height={11} />
												main
											</span>
										</div>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</motion.div>
			</div>
		</motion.div>
	);
}
