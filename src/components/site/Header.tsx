import { LinkRoundIcon } from "@solar-icons/react/linear/link-round";
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
		<header className="sticky top-0 z-50 w-full">
			<div className="glass border-b border-hairline">
				<div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 sm:px-6">
					<Link
						to="/"
						className="flex items-center gap-2 font-semibold tracking-tight"
					>
						<span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
							<LinkRoundIcon size={14} />
						</span>
						<span>DevLinks</span>
					</Link>

					<nav className="hidden items-center justify-center gap-1 md:flex">
						{nav.map((item) => (
							<a
								key={item.href}
								href={item.href}
								className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
							>
								{item.label}
							</a>
						))}
					</nav>

					<div className="flex items-center gap-2">
						<a
							href="https://github.com"
							target="_blank"
							rel="noreferrer"
							aria-label="GitHub"
							className="hidden h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground sm:inline-flex"
						>
							<GithubIcon size={16} />
						</a>
						<ThemeToggle />
						{isAuthenticated && user ? (
							<Link
								to="/dashboard"
								className="inline-flex h-9 items-center rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
							>
								Dashboard
							</Link>
						) : (
							<>
								<Link
									to="/sign-in"
									className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
								>
									Sign in
								</Link>
								<Link
									to="/sign-up"
									className="inline-flex h-9 items-center rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
								>
									Get started
								</Link>
							</>
						)}
					</div>
				</div>
			</div>
		</header>
	);
}
