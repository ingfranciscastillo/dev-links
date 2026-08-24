import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";

export function Cta() {
	return (
		<section id="cta" className="border-t border-hairline">
			<div className="relative mx-auto max-w-5xl overflow-hidden px-4 py-24 sm:px-6">
				<div className="absolute inset-0 -z-10 radial-glow" aria-hidden />
				<div className="mx-auto max-w-2xl text-center">
					<h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
						<span className="text-gradient">
							Your devlinks.com/handle is waiting.
						</span>
					</h2>
					<p className="mx-auto mt-4 max-w-xl text-pretty text-muted-foreground">
						Sign up in 30 seconds. Connect GitHub. Share a single link from
						every bio you have.
					</p>

					<form
						onSubmit={(e) => e.preventDefault()}
						className="mx-auto mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
					>
						<div className="flex h-11 flex-1 items-center rounded-md border border-border bg-surface pl-3 focus-within:ring-2 focus-within:ring-ring">
							<span className="select-none font-mono text-sm text-muted-foreground">
								devlinks.com/
							</span>
							<input
								aria-label="Your username"
								placeholder="your-handle"
								className="h-full flex-1 bg-transparent px-1 text-sm placeholder:text-muted-foreground focus:outline-none"
							/>
						</div>
						<button
							type="submit"
							className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
						>
							Claim it <ArrowRightIcon size={16} />
						</button>
					</form>
					<p className="mt-3 text-xs text-muted-foreground">
						No credit card. Free forever.
					</p>
				</div>
			</div>
		</section>
	);
}
