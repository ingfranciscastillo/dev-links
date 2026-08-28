import { ArrowRightIcon, ArrowRightUpIcon } from "@solar-icons/react/linear";
import { motion, useReducedMotion } from "motion/react";

import { GithubIcon } from "@/components/brand-icons";
import { ProfilePreview } from "./ProfilePreview";

const ease = [0.16, 1, 0.3, 1] as const;

export function Hero() {
	const reduceMotion = useReducedMotion();

	const duration = reduceMotion ? 0.01 : 0.7;

	return (
		<section id="top" className="relative">
			<div className="mx-auto w-full max-w-editorial px-5 pb-24 pt-28 sm:px-8 sm:pb-32 sm:pt-36 lg:pt-44">
				<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
					<div>
						<motion.p
							className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground"
							initial={{ opacity: 0, y: 8 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: reduceMotion ? 0.01 : 0.5,
								delay: 0.1,
								ease,
							}}
						>
							DevLinks — Developer Identity Platform
						</motion.p>

						<motion.h1 className="mt-7 max-w-5xl text-balance font-display text-[15vw] leading-[0.88] tracking-[-0.045em] text-foreground sm:text-[6.5rem] md:text-[8rem] lg:text-[9rem]">
							{[
								{ text: "Everything", delay: 0.18 },
								{ text: "you build.", delay: 0.26 },
							].map(({ text, delay }) => (
								<motion.span
									key={text}
									className="block"
									initial={{
										opacity: 0,
										y: 22,
										filter: "blur(4px)",
									}}
									animate={{
										opacity: 1,
										y: 0,
										filter: "blur(0px)",
									}}
									transition={{
										duration,
										delay,
										ease,
									}}
								>
									{text.endsWith(".") ? (
										<>
											{text.slice(0, -1)}
											<span className="text-brand">.</span>
										</>
									) : (
										text
									)}
								</motion.span>
							))}

							<motion.span
								className="block italic text-brand"
								initial={{
									opacity: 0,
									y: 22,
									filter: "blur(4px)",
								}}
								animate={{
									opacity: 1,
									y: 0,
									filter: "blur(0px)",
								}}
								transition={{
									duration,
									delay: 0.34,
									ease,
								}}
							>
								One address.
							</motion.span>
						</motion.h1>
					</div>

					<motion.p
						className="max-w-xs pb-2 text-[15px] leading-relaxed text-muted-foreground lg:justify-self-end lg:text-base"
						initial={{ opacity: 0, y: 14 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.6,
							delay: 0.48,
							ease,
						}}
					>
						One page for your work, writing, projects, profiles, and everything
						you want people to find.
					</motion.p>
				</div>

				<motion.div
					className="mt-12 h-px w-full bg-border sm:mt-16"
					initial={{ opacity: 0, scaleX: 0 }}
					animate={{ opacity: 1, scaleX: 1 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.6,
						delay: 0.56,
						ease,
					}}
					style={{ originX: 0 }}
				/>

				<div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
					<motion.p
						className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.5,
							delay: 0.64,
							ease,
						}}
					>
						devlinks.com/
						<span className="text-foreground">your-handle</span>
					</motion.p>

					<motion.div
						className="flex flex-wrap items-center gap-4"
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.5,
							delay: 0.72,
							ease,
						}}
					>
						<a
							href="/#cta"
							className="group inline-flex items-center gap-2 border border-foreground px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
						>
							Create your profile
							<ArrowRightIcon
								size={13}
								className="transition-transform duration-300 group-hover:translate-x-1"
							/>
						</a>

						<a
							href="/francis"
							className="inline-flex items-center gap-2 px-1 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
						>
							<GithubIcon size={14} />
							See example
							<ArrowRightUpIcon size={13} />
						</a>
					</motion.div>
				</div>

				<motion.div
					className="mt-20 sm:mt-24 lg:mt-32"
					initial={{ opacity: 0, y: 30 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.9,
						delay: 0.82,
						ease,
					}}
				>
					<div className="mb-4 flex items-center justify-between">
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
							01 / Public profile
						</p>

						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
							Live preview
						</p>
					</div>

					<div className="border border-border bg-surface-elevated">
						<ProfilePreview />
					</div>
				</motion.div>
			</div>
		</section>
	);
}
