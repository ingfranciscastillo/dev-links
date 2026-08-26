import { SiGithub } from "@icons-pack/react-simple-icons";
import { GitFork, Star } from "lucide-react";
import type { GithubPayload } from "@/lib/integrations/types";

export function GithubBlock({ payload }: { payload: GithubPayload }) {
	const pinned =
		payload.pinned.length > 0 ? payload.pinned : payload.repos.slice(0, 6);
	return (
		<section>
			<div className="mb-4 flex items-baseline justify-between">
				<h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
					<SiGithub className="h-3.5 w-3.5" /> GitHub
				</h2>
				<a
					href={payload.profile.html_url}
					target="_blank"
					rel="noreferrer"
					className="font-mono text-xs text-muted-foreground hover:text-foreground"
				>
					@{payload.profile.login} · {payload.profile.followers} followers
				</a>
			</div>

			{payload.heatmap.length > 0 && <Heatmap heatmap={payload.heatmap} />}

			<div className="mt-4 grid gap-3 sm:grid-cols-2">
				{pinned.map((r) => (
					<a
						key={r.full_name}
						href={r.url}
						target="_blank"
						rel="noreferrer"
						className="rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-elevated"
					>
						<div className="flex items-center justify-between">
							<p className="truncate text-sm font-medium">{r.name}</p>
							{r.language && (
								<span className="font-mono text-[10px] text-muted-foreground">
									{r.language}
								</span>
							)}
						</div>
						{r.description && (
							<p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
								{r.description}
							</p>
						)}
						<div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
							<span className="inline-flex items-center gap-1">
								<Star className="h-3 w-3" />
								{r.stars}
							</span>
							<span className="inline-flex items-center gap-1">
								<GitFork className="h-3 w-3" />
								{r.forks}
							</span>
						</div>
					</a>
				))}
			</div>
		</section>
	);
}

function buildWeeks(heatmap: GithubPayload["heatmap"]) {
	if (heatmap.length === 0) return [];

	const byDate = new Map(heatmap.map((c) => [c.date, c.level]));
	const start = new Date(`${heatmap[0].date}T00:00:00Z`);
	const end = new Date(`${heatmap[heatmap.length - 1].date}T00:00:00Z`);

	const gridStart = new Date(start);
	gridStart.setUTCDate(gridStart.getUTCDate() - gridStart.getUTCDay());

	const days: Array<{ date: string; level: number }> = [];
	for (
		let d = new Date(gridStart);
		d <= end;
		d.setUTCDate(d.getUTCDate() + 1)
	) {
		const iso = d.toISOString().slice(0, 10);
		days.push({ date: iso, level: byDate.get(iso) ?? 0 });
	}

	const weeks: Array<Array<{ date: string; level: number }>> = [];
	for (let i = 0; i < days.length; i += 7) {
		weeks.push(days.slice(i, i + 7));
	}
	return weeks;
}

function Heatmap({ heatmap }: { heatmap: GithubPayload["heatmap"] }) {
	const weeks = buildWeeks(heatmap);
	const colors = [
		"bg-surface-elevated",
		"bg-emerald-900/60",
		"bg-emerald-700/70",
		"bg-emerald-500/80",
		"bg-emerald-400",
	];
	return (
		<div className="overflow-x-auto rounded-xl border border-hairline bg-surface p-3">
			<div className="flex gap-0.75">
				{weeks.map((week) => (
					<div key={week[0].date} className="flex flex-col gap-0.75">
						{week.map((c) => (
							<span
								key={c.date}
								title={c.date}
								className={`h-2.5 w-2.5 rounded-[2px] ${colors[c.level] ?? colors[0]}`}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
