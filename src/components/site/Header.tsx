import { LinkRoundIcon } from "@solar-icons/react/linear/link-round";
import { Link } from "@tanstack/react-router";
import { GithubIcon } from "@/components/brand-icons";

export function Header() {
	return (
		<header className="border-b border-hairline">
			<div className="mx-auto grid max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-4 sm:px-6">
				<Link
					to="/"
					className="flex items-center gap-2 font-semibold tracking-tight"
				>
					<span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
						<LinkRoundIcon size={14} />
					</span>
					DevLinks
				</Link>
				<nav className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
					<a href="/#features" className="hover:text-foreground">
						Features
					</a>
					<a href="/#pricing" className="hover:text-foreground">
						Pricing
					</a>
					<a href="/#faq" className="hover:text-foreground">
						FAQ
					</a>
				</nav>
				<div className="flex items-center gap-2">
					<a
						href="https://github.com"
						target="_blank"
						rel="noreferrer noopener"
						aria-label="GitHub"
						className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline bg-surface text-muted-foreground transition-colors hover:text-foreground"
					>
						<GithubIcon size={16} />
					</a>
					<Link
						to="/sign-in"
						className="inline-flex h-9 items-center rounded-md border border-hairline bg-surface px-3 text-sm font-medium text-foreground transition-colors hover:bg-surface-elevated"
					>
						Sign in
					</Link>
					<Link
						to="/sign-up"
						className="inline-flex h-9 items-center rounded-md bg-foreground px-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
					>
						Get started
					</Link>
				</div>
			</div>
		</header>
	);
}
