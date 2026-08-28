import { ArrowRightUpIcon } from "@solar-icons/react/linear";

import { Link } from "@tanstack/react-router";

import { GithubIcon } from "@/components/brand-icons";
import { authClient } from "@/lib/auth-client";

import { ThemeToggle } from "./ThemeToggle";

const nav = [
	{ label: "Features", href: "/#features" },
	{ label: "Examples", href: "/#examples" },
	{ label: "Pricing", href: "/#pricing" },
	{ label: "Discover", href: "/discover" },
];

export function Header() {
	const { data: session } = authClient.useSession();
	const user = session?.user ?? null;
	const isAuthenticated = Boolean(user);

	return (
		<header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm">
			<div className="mx-auto flex h-16 max-w-editorial items-center justify-between border-b border-border px-5 sm:px-8">
				<Link to="/" className="group flex items-center gap-2.5">
					<span className="font-display text-xl leading-none tracking-[-0.03em] text-foreground">
						DevLinks
					</span>
					<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
						01
					</span>
				</Link>

				<nav className="hidden items-center gap-7 md:flex">
					{nav.map((item) => (
						<a
							key={item.href}
							href={item.href}
							className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
						>
							{item.label}
						</a>
					))}
				</nav>

				<div className="flex items-center gap-4">
					<a
						href="https://github.com"
						target="_blank"
						rel="noreferrer"
						aria-label="GitHub"
						className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
					>
						<GithubIcon size={16} />
					</a>

					<ThemeToggle />

					{isAuthenticated && user ? (
						<Link
							to="/dashboard"
							className="group inline-flex items-center gap-2 border border-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
						>
							Dashboard
							<ArrowRightUpIcon
								size={13}
								className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
							/>
						</Link>
					) : (
						<>
							<Link
								to="/login"
								search={{ redirect: undefined }}
								className="hidden font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
							>
								Sign in
							</Link>

							<Link
								to="/signup"
								className="group inline-flex items-center gap-2 border border-foreground px-4 py-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
							>
								Get started
								<ArrowRightUpIcon
									size={13}
									className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
								/>
							</Link>
						</>
					)}
				</div>
			</div>
		</header>
	);
}
