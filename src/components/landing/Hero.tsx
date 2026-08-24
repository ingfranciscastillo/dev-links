import { ArrowRightIcon, StarsIcon } from "@solar-icons/react/linear";
import gsap from "gsap";
import { useEffect, useRef } from "react";
import { GithubIcon } from "@/components/brand-icons";
import { ProfilePreview } from "./ProfilePreview";

export function Hero() {
	const root = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!root.current) return;
		const ctx = gsap.context(() => {
			gsap.from("[data-anim='hero-item']", {
				y: 18,
				opacity: 0,
				duration: 0.8,
				ease: "power3.out",
				stagger: 0.08,
			});
			gsap.from("[data-anim='hero-card']", {
				y: 30,
				opacity: 0,
				duration: 1,
				delay: 0.2,
				ease: "power3.out",
			});
		}, root);
		return () => ctx.revert();
	}, []);

	return (
		<section ref={root} className="relative overflow-hidden">
			<div className="absolute inset-0 -z-10 grid-bg" aria-hidden />
			<div className="absolute inset-0 -z-10 radial-glow" aria-hidden />

			<div className="mx-auto max-w-6xl px-4 pb-20 pt-20 sm:px-6 sm:pt-28 lg:pt-32">
				<div className="mx-auto max-w-3xl text-center">
					<a
						href="/#features"
						data-anim="hero-item"
						className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						<StarsIcon size={12} className="text-brand" />
						Now in beta — claim your username
						<ArrowRightIcon size={12} />
					</a>

					<h1
						data-anim="hero-item"
						className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
					>
						<span className="text-gradient">
							The link-in-bio built for developers.
						</span>
					</h1>

					<p
						data-anim="hero-item"
						className="mx-auto mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg"
					>
						One page for your repos, snippets, articles and projects.
						Auto-synced with GitHub, Dev.to, Hashnode, Medium and Stack
						Overflow.
					</p>

					<div
						data-anim="hero-item"
						className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
					>
						<a
							href="/#cta"
							className="inline-flex h-11 items-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90"
						>
							Claim your devlinks.com/you
							<ArrowRightIcon size={16} />
						</a>
						<a
							href="/francis"
							className="inline-flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-5 text-sm font-medium transition-colors hover:bg-surface-elevated"
						>
							<GithubIcon size={16} />
							See a live profile
						</a>
					</div>

					<p
						data-anim="hero-item"
						className="mt-4 font-mono text-xs text-muted-foreground"
					>
						devlinks.com/<span className="text-foreground">your-handle</span>
					</p>
				</div>

				<div data-anim="hero-card" className="relative mx-auto mt-16 max-w-4xl">
					<div
						className="absolute inset-x-10 -top-6 -z-10 h-40 bg-brand/30 blur-3xl"
						aria-hidden
					/>
					<ProfilePreview />
				</div>
			</div>
		</section>
	);
}
