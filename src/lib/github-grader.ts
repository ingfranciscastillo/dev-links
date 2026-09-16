import type { GithubPayload } from "./integrations/types";

export interface GraderCheck {
	id: string;
	label: string;
	passed: boolean;
	weight: number;
	tip: string;
}

export type GraderGrade = "A" | "B" | "C" | "D" | "F";

export interface GraderReport {
	score: number;
	grade: GraderGrade;
	checks: GraderCheck[];
}

function monthsActiveInLastYear(heatmap: GithubPayload["heatmap"]): number {
	const active = new Set<string>();
	for (const day of heatmap) {
		if ((day.count ?? 0) > 0) active.add(day.date.slice(0, 7));
	}
	return active.size;
}

function activeInLast30Days(heatmap: GithubPayload["heatmap"]): boolean {
	const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
	return heatmap.some(
		(day) => (day.count ?? 0) > 0 && new Date(day.date).getTime() >= cutoff,
	);
}

function gradeFromScore(score: number): GraderGrade {
	if (score >= 85) return "A";
	if (score >= 70) return "B";
	if (score >= 55) return "C";
	if (score >= 40) return "D";
	return "F";
}

// Deliberately does NOT score followers, stars, or public_repos count — those
// reward tenure/popularity, not presentation, and would unfairly punish
// exactly the junior/early-career developers this tool is meant to help.
// Every check here is something a profile can fix today, regardless of how
// long the account has existed.
export function gradeGithubProfile(
	payload: GithubPayload,
	hasProfileReadme: boolean,
): GraderReport {
	const hasDescribedRepo = payload.repos.some((r) => !!r.description?.trim());
	const languageCount = new Set(
		payload.repos.map((r) => r.language).filter((l): l is string => !!l),
	).size;

	const checks: GraderCheck[] = [
		{
			id: "bio",
			label: "Profile has a bio",
			passed: !!payload.profile.bio?.trim(),
			weight: 15,
			tip: "Add a one-line bio on github.com/settings/profile — it's the first thing anyone reads.",
		},
		{
			id: "profile-readme",
			label: `Has a ${payload.profile.login}/${payload.profile.login} profile README`,
			passed: hasProfileReadme,
			weight: 20,
			tip: "Create a repo named exactly like your username to unlock GitHub's special profile README.",
		},
		{
			id: "described-repo",
			label: "At least one repo has a description",
			passed: hasDescribedRepo,
			weight: 15,
			tip: "A repo with no description tells visitors nothing about what it does.",
		},
		{
			id: "recent-activity",
			label: "Committed something in the last 30 days",
			passed: activeInLast30Days(payload.heatmap),
			weight: 20,
			tip: "A stale contribution graph is one of the first things recruiters notice.",
		},
		{
			id: "consistency",
			label: "Active in at least 6 of the last 12 months",
			passed: monthsActiveInLastYear(payload.heatmap) >= 6,
			weight: 15,
			tip: "Long gaps in your contribution history stand out more than you'd think.",
		},
		{
			id: "language-diversity",
			label: "Public repos show 2+ languages",
			passed: languageCount >= 2,
			weight: 15,
			tip: "If you work across more than one stack, make sure it actually shows here.",
		},
	];

	const score = checks.reduce((sum, c) => sum + (c.passed ? c.weight : 0), 0);

	return { score, grade: gradeFromScore(score), checks };
}
