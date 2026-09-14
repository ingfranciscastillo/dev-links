import { SiGitlab } from "@icons-pack/react-simple-icons";
import { ArrowRightUpIcon, StarIcon } from "@solar-icons/react/linear";
import { GitFork } from "lucide-react";
import type { GitlabPayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function GitlabBlock({
	payload,
	themed = false,
}: {
	payload: GitlabPayload;
	themed?: boolean;
}) {
	if (payload.repos.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiGitlab className="h-3.5 w-3.5" /> GitLab
				</span>
				<a
					href={payload.profile.url}
					target="_blank"
					rel="noreferrer"
					className={cx(
						"font-mono text-[11px] normal-case tracking-normal transition-opacity",
						themed ? "hover:opacity-80" : "hover:text-foreground",
					)}
				>
					@{payload.profile.username}
				</a>
			</h2>
			<div className="grid gap-2 sm:grid-cols-2">
				{payload.repos.slice(0, 6).map((r) => (
					<a
						key={r.url}
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
						<div className="flex items-start justify-between gap-2">
							<p className="truncate font-mono text-sm font-medium">{r.name}</p>
							<ArrowRightUpIcon
								className={cx(
									"h-4 w-4 shrink-0",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							/>
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
								"mt-2 flex items-center gap-3 text-[11px]",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							<span className="inline-flex items-center gap-1">
								<StarIcon className="h-3 w-3" />
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
