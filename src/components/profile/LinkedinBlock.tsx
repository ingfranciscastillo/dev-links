import { ArrowUpRight } from "lucide-react";
import type { LinkedinPayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function LinkedinBlock({
	payload,
	themed = false,
}: {
	payload: LinkedinPayload;
	themed?: boolean;
}) {
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				LinkedIn
			</h2>
			<a
				href={payload.url}
				target="_blank"
				rel="noreferrer"
				className={cx(
					"flex items-start justify-between gap-3 rounded-xl border p-4 transition-colors",
					themed
						? "tt-panel hover:opacity-90"
						: "border-hairline bg-surface hover:bg-surface-elevated",
				)}
			>
				<div className="min-w-0">
					<p className="truncate font-mono text-sm font-medium">
						/in/{payload.slug}
					</p>
					<p
						className={cx(
							"mt-1 line-clamp-2 text-xs",
							themed ? "tt-muted" : "text-muted-foreground",
						)}
					>
						{payload.headline ||
							"View full experience and recommendations on LinkedIn."}
					</p>
				</div>
				<ArrowUpRight
					className={cx(
						"h-4 w-4 shrink-0",
						themed ? "tt-muted" : "text-muted-foreground",
					)}
				/>
			</a>
		</section>
	);
}
