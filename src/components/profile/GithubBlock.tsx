import { SiGithub } from "@icons-pack/react-simple-icons";
import { GitFork, Star } from "lucide-react";
import type { GithubPayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function GithubBlock({
	payload,
	themed = false,
}: {
	payload: GithubPayload;
	themed?: boolean;
}) {
	const pinned =
		payload.pinned.length > 0 ? payload.pinned : payload.repos.slice(0, 6);
	return (
		<section>
			<div className="mb-4 flex items-baseline justify-between">
				<h2
					className={cx(
						"flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
						themed ? "tt-muted" : "text-muted-foreground",
					)}
				>
					<SiGithub className="h-3.5 w-3.5" /> GitHub
				</h2>
				<a
					href={payload.profile.html_url}
					target="_blank"
					rel="noreferrer"
					className={cx(
						"font-mono text-xs transition-opacity",
						themed
							? "tt-muted hover:opacity-100"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					@{payload.profile.login} · {payload.profile.followers} followers
				</a>
			</div>

			{payload.heatmap.length > 0 && (
				<Heatmap heatmap={payload.heatmap} themed={themed} />
			)}

			<div className="mt-4 grid gap-3 sm:grid-cols-2">
				{pinned.map((r) => (
					<a
						key={r.full_name}
						href={r.url}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"rounded-xl border p-4 transition-colors",
							themed
								? "tt-panel hover:opacity-90"
								: "border-hairline bg-surface hover:bg-surface-elevated",
						)}
					>
						<div className="flex items-center justify-between">
							<p className="truncate text-sm font-medium">{r.name}</p>
							{r.language && (
								<span
									className={cx(
										"font-mono text-[10px]",
										themed ? "tt-muted" : "text-muted-foreground",
									)}
								>
									{r.language}
								</span>
							)}
						</div>
						{r.description && (
							<p
								className={cx(
									"mt-1 line-clamp-2 text-xs",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								{r.description}
							</p>
						)}
						<div
							className={cx(
								"mt-3 flex gap-4 text-[11px]",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
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

// Colores fijos (verde GitHub clásico) para perfiles sin tema custom.
const LEDGER_LEVEL_COLORS = [
	"bg-surface-elevated",
	"bg-emerald-900/60",
	"bg-emerald-700/70",
	"bg-emerald-500/80",
	"bg-emerald-400",
];

// Con tema custom, el heatmap usa el color de acento del creador (mezclado
// con la superficie del tema para dar 5 niveles de intensidad) en vez de
// verde fijo — así no choca con temas cuyo acento no es verde (Cyberpunk,
// Neon, etc.).
const THEMED_LEVEL_BG = [
	"var(--tt-surface)",
	"color-mix(in oklab, var(--tt-accent) 25%, var(--tt-surface))",
	"color-mix(in oklab, var(--tt-accent) 50%, var(--tt-surface))",
	"color-mix(in oklab, var(--tt-accent) 75%, var(--tt-surface))",
	"var(--tt-accent)",
];

function Heatmap({
	heatmap,
	themed,
}: {
	heatmap: GithubPayload["heatmap"];
	themed?: boolean;
}) {
	const weeks = buildWeeks(heatmap);
	return (
		<div
			className={cx(
				"overflow-x-auto rounded-xl border p-3",
				themed ? "tt-panel" : "border-hairline bg-surface",
			)}
		>
			<div className="flex gap-0.75">
				{weeks.map((week) => (
					<div key={week[0].date} className="flex flex-col gap-0.75">
						{week.map((c) => (
							<span
								key={c.date}
								title={c.date}
								className={cx(
									"h-2.5 w-2.5 rounded-[2px]",
									!themed &&
										(LEDGER_LEVEL_COLORS[c.level] ?? LEDGER_LEVEL_COLORS[0]),
								)}
								style={
									themed
										? {
												background:
													THEMED_LEVEL_BG[c.level] ?? THEMED_LEVEL_BG[0],
											}
										: undefined
								}
							/>
						))}
					</div>
				))}
			</div>
		</div>
	);
}
