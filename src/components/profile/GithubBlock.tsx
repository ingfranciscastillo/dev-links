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

function Heatmap({ heatmap }: { heatmap: GithubPayload["heatmap"] }) {
	// Group by week; heatmap is already chronological.
	const weeks: Array<Array<{ date: string; level: number }>> = [];
	let current: Array<{ date: string; level: number }> = [];
	for (const cell of heatmap) {
		const dow = new Date(cell.date).getUTCDay();
		if (dow === 0 && current.length) {
			weeks.push(current);
			current = [];
		}
		current.push(cell);
	}
	if (current.length) weeks.push(current);

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
				{weeks.map((week, _) => (
					<div key={crypto.randomUUID()} className="flex flex-col gap-0.75">
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
