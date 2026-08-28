import { SiDocker } from "@icons-pack/react-simple-icons";
import { ArrowUpRight, Download, Star } from "lucide-react";
import type { DockerhubPayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

function compact(n: number) {
	return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export function DockerhubBlock({
	payload,
	themed = false,
}: {
	payload: DockerhubPayload;
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
					<SiDocker className="h-3.5 w-3.5" /> Docker Hub
				</span>
				<span className="font-mono text-[11px] normal-case tracking-normal">
					{compact(payload.total_pulls)} pulls
				</span>
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
							<p className="truncate font-mono text-sm font-medium">
								{r.namespace}/{r.name}
							</p>
							<ArrowUpRight
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
								<Download className="h-3 w-3" />
								{compact(r.pulls)}
							</span>
							<span className="inline-flex items-center gap-1">
								<Star className="h-3 w-3" />
								{r.stars}
							</span>
						</div>
					</a>
				))}
			</div>
		</section>
	);
}
