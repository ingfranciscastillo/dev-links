import { ArrowRightIcon } from "@solar-icons/react/linear";

export function Cta() {
	return (
		<section id="cta" className="border-t border-border">
			<div className="mx-auto max-w-editorial px-5 py-28 sm:px-8 sm:py-36 lg:py-44">
				<div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
							06 / Get started
						</p>
						<h2 className="mt-6 max-w-4xl font-display text-[13vw] leading-[0.88] tracking-[-0.045em] text-foreground sm:text-7xl md:text-8xl lg:text-9xl">
							Your <br /> <span className="italic text-brand">address</span>
							<br /> is waiting.
						</h2>
					</div>
					<div className="lg:pb-2">
						<p className="text-[15px] leading-relaxed text-muted-foreground sm:text-base">
							Sign up in 30 seconds. Connect your services. Share one profile
							everywhere.
						</p>
						<form onSubmit={(e) => e.preventDefault()} className="mt-8">
							<label htmlFor="cta-username" className="sr-only">
								Your username
							</label>
							<div className="flex border-b border-foreground pb-2 focus-within:border-brand">
								<span className="shrink-0 font-mono text-[12px] text-muted-foreground">
									devlinks.com/
								</span>
								<input
									id="cta-username"
									placeholder="your-handle"
									className="min-w-0 flex-1 bg-transparent px-1 font-mono text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
								/>
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
							</div>
							<p className="mt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
								No credit card · Free forever
							</p>
						</form>
					</div>
				</div>
			</div>
		</section>
	);
}
