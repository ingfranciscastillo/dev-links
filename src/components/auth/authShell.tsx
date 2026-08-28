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
		<div className="min-h-dvh bg-background text-foreground">
			<header className="mx-auto flex h-16 w-full max-w-editorial items-center justify-between border-b border-border px-5 sm:px-8">
				<Link to="/" className="flex items-center gap-2.5">
					<span className="font-display text-xl leading-none tracking-[-0.03em]">
						DevLinks
					</span>
					<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
						01
					</span>
				</Link>
				{footer}
			</header>
			<main className="mx-auto w-full max-w-editorial px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
				<div className="mx-auto w-full max-w-md">
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
							DevLinks / Account
						</p>
						<h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							{title}
						</h1>
						{subtitle ? (
							<p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
								{subtitle}
							</p>
						) : null}
					</div>
					<div className="mt-10 border-t border-border pt-8">{children}</div>
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
			? "inline-flex h-11 items-center justify-center gap-2.5 border border-border font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
			: "inline-flex h-11 cursor-not-allowed items-center justify-center gap-2.5 border border-border font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground opacity-50";
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-2 gap-3">
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
					<GithubIcon size={15} /> GitHub
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
					<GoogleIcon size={15} /> Google
				</button>
			</div>
			<div className="flex items-center gap-4">
				<div className="h-px flex-1 bg-border" />
				<span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
					or continue with email
				</span>
				<div className="h-px flex-1 bg-border" />
			</div>
		</div>
	);
}
