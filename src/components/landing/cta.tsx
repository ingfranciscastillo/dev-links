import { ArrowRightIcon, UnreadIcon } from "@solar-icons/react/linear";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type FormEvent, useState } from "react";
import {
	type UsernameAvailability,
	useUsernameAvailability,
} from "@/hooks/use-username-availability";

const ease = [0.16, 1, 0.3, 1] as const;

const STATUS_COPY: Record<UsernameAvailability, string | null> = {
	idle: null,
	invalid: "At least 3 characters, a-z 0-9 _ -",
	checking: "Checking…",
	available: "Available",
	taken: "Already taken",
};

export function Cta() {
	const reduceMotion = useReducedMotion();
	const navigate = useNavigate();

	const [username, setUsername] = useState("");
	const status = useUsernameAvailability(username);

	function handleSubmit(e: FormEvent) {
		e.preventDefault();
		const value = username.trim().toLowerCase();
		navigate({ to: "/signup", search: { username: value || undefined } });
	}

	return (
		<section id="cta" className="border-t border-border">
			<div className="mx-auto max-w-editorial px-5 py-28 sm:px-8 sm:py-36 lg:py-44">
				<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
					<motion.div
						initial={reduceMotion ? false : { opacity: 0, y: 24 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.35 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.8,
							ease,
						}}
					>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
							06 / Get started
						</p>

						<h2 className="mt-6 max-w-4xl font-display text-[13vw] leading-[0.88] tracking-[-0.045em] text-foreground sm:text-7xl md:text-8xl lg:text-9xl">
							Your <br />
							<span className="italic text-brand">address</span>
							<br /> is waiting.
						</h2>
					</motion.div>

					<motion.div
						className="lg:pb-2"
						initial={reduceMotion ? false : { opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, amount: 0.3 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.7,
							delay: reduceMotion ? 0 : 0.12,
							ease,
						}}
					>
						<p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
							Sign up in 30 seconds. Connect your services. Share one profile
							everywhere.
						</p>

						<form onSubmit={handleSubmit} className="mt-8">
							<label htmlFor="cta-username" className="sr-only">
								Your username
							</label>

							<motion.div
								whileFocus={
									reduceMotion
										? undefined
										: {
												x: 2,
											}
								}
								animate={
									reduceMotion || status !== "taken"
										? { x: 0 }
										: { x: [0, -3, 3, 0] }
								}
								transition={{
									duration: 0.2,
									ease,
								}}
								className={`flex items-center border-b pb-2 transition-colors focus-within:border-brand ${
									status === "taken"
										? "border-destructive"
										: "border-foreground"
								}`}
							>
								<span className="shrink-0 font-mono text-[12px] text-muted-foreground">
									devlinks.com/
								</span>

								<input
									id="cta-username"
									placeholder="your-handle"
									value={username}
									onChange={(e) => setUsername(e.target.value)}
									autoComplete="off"
									spellCheck={false}
									className="min-w-0 flex-1 bg-transparent px-1 font-mono text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
								/>

								<AnimatePresence>
									{status === "available" && (
										<motion.span
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.9 }}
											transition={{ duration: 0.15, ease }}
											className="shrink-0 text-brand"
										>
											<UnreadIcon size={16} />
										</motion.span>
									)}
								</AnimatePresence>

								<button
									type="submit"
									aria-label="Claim username"
									className="group ml-3 inline-flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:text-brand"
								>
									Claim it
									<ArrowRightIcon
										size={13}
										className="transition-transform duration-300 group-hover:translate-x-1"
									/>
								</button>
							</motion.div>

							<div className="mt-3 min-h-4">
								<AnimatePresence mode="wait">
									<motion.p
										key={status}
										initial={reduceMotion ? false : { opacity: 0, y: -4 }}
										animate={{ opacity: 1, y: 0 }}
										exit={{ opacity: 0, y: 4 }}
										transition={{ duration: 0.15, ease }}
										className={`font-mono text-[9px] uppercase tracking-[0.08em] ${
											status === "taken"
												? "text-destructive"
												: status === "available"
													? "text-brand"
													: "text-muted-foreground"
										}`}
									>
										{STATUS_COPY[status] ?? "No credit card · Free forever"}
									</motion.p>
								</AnimatePresence>
							</div>
						</form>
					</motion.div>
				</div>
			</div>
		</section>
	);
}
