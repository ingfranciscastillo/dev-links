import { LinkRoundIcon } from "@solar-icons/react/linear/link-round";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GithubIcon, GoogleIcon } from "@/components/brand-icons";
import { authClient } from "@/lib/auth-client";

const githubEnabled = Boolean(
	import.meta.env.VITE_AUTH_GITHUB_ENABLED ?? false,
);
const googleEnabled = Boolean(
	import.meta.env.VITE_AUTH_GOOGLE_ENABLED ?? false,
);

export function AuthShell({
	title,
	subtitle,
	children,
	footer,
}: {
	title: string;
	subtitle?: string;
	children: ReactNode;
	footer?: ReactNode;
}) {
	return (
		<div className="relative min-h-dvh bg-background text-foreground">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,oklch(0.7_0.2_260/0.12),transparent_60%)]" />
			<header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
				<Link
					to="/"
					className="flex items-center gap-2 font-semibold tracking-tight"
				>
					<span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
						<LinkRoundIcon size={14} />
					</span>
					DevLinks
				</Link>
				{footer}
			</header>

			<main className="mx-auto flex w-full max-w-md flex-col px-4 pb-16 pt-8 sm:px-6">
				<div className="text-center">
					<h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
					{subtitle ? (
						<p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
					) : null}
				</div>

				<div className="mt-8 rounded-xl border border-border bg-surface/60 p-6 shadow-card backdrop-blur">
					{children}
				</div>
			</main>
		</div>
	);
}

export function OAuthRow({ callbackURL }: { callbackURL?: string } = {}) {
	const handleSocial = (provider: "github" | "google") => () => {
		void authClient.signIn.social({
			provider,
			callbackURL: callbackURL ?? "/dashboard",
		});
	};

	const buttonClass = (enabled: boolean) =>
		enabled
			? "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm text-foreground transition-colors hover:bg-surface-elevated"
			: "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-surface text-sm text-muted-foreground opacity-60 cursor-not-allowed";

	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-2">
				<button
					type="button"
					onClick={githubEnabled ? handleSocial("github") : undefined}
					disabled={!githubEnabled}
					title={
						githubEnabled
							? "Continue with GitHub"
							: "GitHub sign-in not configured"
					}
					className={buttonClass(githubEnabled)}
				>
					<GithubIcon size={16} />
					GitHub
				</button>
				<button
					type="button"
					onClick={googleEnabled ? handleSocial("google") : undefined}
					disabled={!googleEnabled}
					title={
						googleEnabled
							? "Continue with Google"
							: "Google sign-in not configured"
					}
					className={buttonClass(googleEnabled)}
				>
					<GoogleIcon size={16} />
					Google
				</button>
			</div>
			<div className="flex items-center gap-3">
				<div className="h-px flex-1 bg-border" />
				<span className="shrink-0 text-xs uppercase tracking-wider text-muted-foreground">
					or continue with email
				</span>
				<div className="h-px flex-1 bg-border" />
			</div>
		</div>
	);
}
