import { ArrowRightIcon } from "@solar-icons/react/linear";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/tools/github-grader/")({
	head: () => ({
		meta: [
			{ title: "GitHub Profile Grader — Free tool by DevLinks" },
			{
				name: "description",
				content:
					"Check your GitHub profile: bio, profile README, recent activity, and consistency. Free, no sign-up, no GitHub login required.",
			},
			{
				property: "og:title",
				content: "GitHub Profile Grader — Free tool by DevLinks",
			},
			{
				property: "og:description",
				content:
					"Check your GitHub profile in seconds — bio, profile README, recent activity, and consistency.",
			},
		],
		links: [{ rel: "canonical", href: absoluteUrl("/tools/github-grader") }],
	}),
	component: GithubGraderLanding,
});

function GithubGraderLanding() {
	const navigate = useNavigate();
	const [username, setUsername] = useState("");
	const [error, setError] = useState<string | null>(null);

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		const value = username.trim().replace(/^@/, "");
		if (!/^[a-zA-Z0-9-]{1,39}$/.test(value)) {
			setError("Enter a valid GitHub username.");
			return;
		}
		navigate({ to: "/tools/github-grader/$username", params: { username: value } });
	}

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Free tool
				</p>

				<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					GitHub Profile Grader.
				</h1>

				<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
					Enter a GitHub username. We check bio, profile README, recent
					activity, and consistency — no sign-up, no GitHub login, no data
					stored beyond a one-hour cache.
				</p>

				<form onSubmit={handleSubmit} className="mt-10 max-w-md">
					<div className="flex border-b border-foreground pb-2">
						<span className="shrink-0 font-mono text-[12px] text-muted-foreground">
							github.com/
						</span>
						<input
							value={username}
							onChange={(event) => {
								setUsername(event.target.value);
								setError(null);
							}}
							placeholder="username"
							autoComplete="off"
							spellCheck={false}
							aria-label="GitHub username"
							className="min-w-0 flex-1 bg-transparent px-1 font-mono text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none"
						/>
						<button
							type="submit"
							className="group ml-3 inline-flex shrink-0 items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:text-brand"
						>
							Check it
							<ArrowRightIcon
								size={13}
								className="transition-transform duration-300 group-hover:translate-x-1"
							/>
						</button>
					</div>
					{error && (
						<p className="mt-3 font-mono text-[9px] uppercase tracking-[0.08em] text-destructive">
							{error}
						</p>
					)}
				</form>
			</main>

			<Footer />
		</div>
	);
}
