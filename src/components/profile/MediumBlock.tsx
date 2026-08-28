import { SiMedium } from "@icons-pack/react-simple-icons";
import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import type { MediumPayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function MediumBlock({
	payload,
	themed = false,
}: {
	payload: MediumPayload;
	themed?: boolean;
}) {
	if (payload.posts.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<SiMedium className="h-3.5 w-3.5" />
				Medium
			</h2>
			<div
				className={cx(
					"divide-y overflow-hidden rounded-xl border",
					themed
						? "tt-panel divide-(--tt-border)"
						: "divide-hairline border-hairline bg-surface",
				)}
			>
				{payload.posts.map((p) => (
					<a
						key={p.url}
						href={p.url}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"flex items-center justify-between gap-4 p-4 transition-colors",
							themed ? "hover:opacity-90" : "hover:bg-surface-elevated",
						)}
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{p.title}</p>
							{p.summary && (
								<p
									className={cx(
										"mt-1 line-clamp-2 text-xs",
										themed ? "tt-muted" : "text-muted-foreground",
									)}
								>
									{p.summary}
								</p>
							)}
						</div>
						<ArrowRightUpIcon
							size={16}
							className={cx(
								"h-4 w-4 shrink-0",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						/>
					</a>
				))}
			</div>
		</section>
	);
}
