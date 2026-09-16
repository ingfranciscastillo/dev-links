import { ArrowRightIcon, CheckCircleIcon, CloseCircleIcon } from "@solar-icons/react/linear";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";
import { XIcon } from "@/components/brand-icons";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
	gradeGithubUsername,
	type GithubGraderResult,
} from "@/lib/api/github-grader.functions";
import { absoluteUrl } from "@/lib/site";

// Fired right at the "aha" moment — the grade is the ego-driven result
// people actually want to share, not the tool itself. Pre-written text
// removes the only friction a share action has (X's intent URL needs no
// auth/SDK — it just opens the composer with these fields pre-filled).
function shareGradeUrl(result: GithubGraderResult, pageUrl: string) {
	const text = `I scored a ${result.report.grade} (${result.report.score}/100) on the DevLinks GitHub Profile Grader — check yours:`;
	const params = new URLSearchParams({ text, url: pageUrl });
	return `https://twitter.com/intent/tweet?${params.toString()}`;
}

const ease = [0.16, 1, 0.3, 1] as const;

export const Route = createFileRoute("/tools/github-grader/$username")({
	loader: async ({ params }) => {
		const username = params.username.toLowerCase();
		const outcome = await gradeGithubUsername({ data: { username } });
		if (!outcome.ok) {
			if (outcome.reason === "not_found") throw notFound();
			// "rate_limited" | "fetch_failed" — real error, not a 404.
			throw new Error(outcome.reason);
		}
		return outcome.data;
	},
	head: ({ loaderData, params }) => {
		if (!loaderData) return {};
		const title = `${loaderData.username}'s GitHub profile — grade ${loaderData.report.grade} — DevLinks`;
		const description = `${loaderData.username} scores ${loaderData.report.score}/100 on the DevLinks GitHub Profile Grader — bio, profile README, activity and consistency.`;
		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
			],
			links: [
				{
					rel: "canonical",
					href: absoluteUrl(`/tools/github-grader/${params.username}`),
				},
			],
		};
	},
	notFoundComponent: () => (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4">
			<div className="text-center">
				<h1 className="text-3xl font-semibold tracking-tight">
					No GitHub user with that username
				</h1>
				<Link
					to="/tools/github-grader"
					className="mt-6 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
				>
					Try another username
				</Link>
			</div>
		</div>
	),
	errorComponent: ({ error, reset }) => {
		const rateLimited = error instanceof Error && error.message === "rate_limited";
		return (
			<div className="flex min-h-dvh items-center justify-center bg-background px-4">
				<div className="text-center">
					<h1 className="text-xl font-semibold tracking-tight text-foreground">
						{rateLimited
							? "Too many checks — try again in a few minutes"
							: "Couldn't grade this profile"}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{rateLimited
							? "This free tool is shared across everyone using it right now."
							: "GitHub's API might be rate-limiting us — try again shortly."}
					</p>
					<div className="mt-6 flex flex-wrap justify-center gap-2">
						<button
							type="button"
							onClick={reset}
							className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
						>
							Try again
						</button>
						<Link
							to="/tools/github-grader"
							className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-elevated"
						>
							Check another username
						</Link>
					</div>
				</div>
			</div>
		);
	},
	component: GithubGraderResultPage,
});

function GithubGraderResultPage() {
	const result: GithubGraderResult = Route.useLoaderData();
	const { profile, totals, topLanguages, report } = result;
	const reduceMotion = useReducedMotion();

	// Guards against firing twice on a fast-refresh/re-render in dev, and
	// against re-firing if the same mounted component re-renders — this
	// should fire once per page load, not once per render.
	const tracked = useRef(false);
	useEffect(() => {
		if (tracked.current) return;
		tracked.current = true;
		posthog.capture("github_grader_completed", {
			grade: report.grade,
			score: report.score,
		});
	}, [report.grade, report.score]);

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<motion.div
					initial={reduceMotion ? false : { opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: reduceMotion ? 0.01 : 0.7, ease }}
				>
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
						GitHub Profile Grader
					</p>

					<div className="mt-6 flex flex-wrap items-end justify-between gap-6">
						<div>
							<h1 className="font-display text-4xl tracking-[-0.03em] sm:text-5xl">
								{profile.name || profile.login}
							</h1>
							<p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
								@{profile.login}
							</p>
						</div>

						<motion.div
							className="text-right"
							initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
							animate={{ opacity: 1, scale: 1 }}
							transition={{
								duration: reduceMotion ? 0.01 : 0.6,
								delay: reduceMotion ? 0 : 0.2,
								ease,
							}}
						>
							<p className="font-display text-6xl leading-none tracking-tight text-brand">
								{report.grade}
							</p>
							<p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
								{report.score}/100
							</p>
							<a
								href={shareGradeUrl(
									result,
									absoluteUrl(`/tools/github-grader/${result.username}`),
								)}
								target="_blank"
								rel="noreferrer"
								className="group mt-3 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
							>
								<XIcon size={11} />
								Share your grade
							</a>
						</motion.div>
					</div>

					{profile.bio && (
						<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
							{profile.bio}
						</p>
					)}

					<div className="mt-8 flex flex-wrap gap-6 border-y border-border py-5 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
						<span>{profile.public_repos} repos</span>
						<span>{totals.stars} stars</span>
						<span>{totals.contributions} contributions</span>
						{topLanguages.length > 0 && (
							<span>Mostly {topLanguages[0]?.language}</span>
						)}
					</div>
				</motion.div>

				<motion.div
					className="mt-12 border-t border-border"
					initial="hidden"
					animate="visible"
					variants={{
						hidden: {},
						visible: {
							transition: { staggerChildren: reduceMotion ? 0 : 0.05, delayChildren: reduceMotion ? 0 : 0.3 },
						},
					}}
				>
					{report.checks.map((check) => (
						<motion.div
							key={check.id}
							variants={{
								hidden: reduceMotion ? {} : { opacity: 0, y: 10 },
								visible: {
									opacity: 1,
									y: 0,
									transition: { duration: reduceMotion ? 0.01 : 0.4, ease },
								},
							}}
							className="grid grid-cols-[1.5rem_minmax(0,1fr)] gap-4 border-b border-border py-5 sm:grid-cols-[1.5rem_minmax(0,1fr)_20rem]"
						>
							{check.passed ? (
								<CheckCircleIcon size={18} className="text-brand" />
							) : (
								<CloseCircleIcon size={18} className="text-muted-foreground" />
							)}
							<p className="text-sm">{check.label}</p>
							{!check.passed && (
								<p className="text-xs leading-relaxed text-muted-foreground sm:text-right">
									{check.tip}
								</p>
							)}
						</motion.div>
					))}
				</motion.div>

				<div className="mt-16 border-t border-border pt-10">
					<h2 className="font-display text-2xl tracking-tight">
						This is what DevLinks keeps current automatically.
					</h2>
					<p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
						Your bio, pinned work, and activity — synced from GitHub (and
						Dev.to, Stack Overflow, and more) onto one profile, without
						editing a README by hand.
					</p>
					<a
						href="/#cta"
						className="group mt-6 inline-flex items-center gap-2 border border-foreground px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
					>
						Claim your DevLinks profile
						<ArrowRightIcon
							size={13}
							className="transition-transform duration-300 group-hover:translate-x-1"
						/>
					</a>
				</div>

				<p className="mt-10">
					<Link
						to="/tools/github-grader"
						className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
					>
						← Check another username
					</Link>
				</p>
			</main>

			<Footer />
		</div>
	);
}
