import { SiDevdotto } from "@icons-pack/react-simple-icons";
import {
	ArrowRightUpIcon,
	ClockCircleIcon,
	EyeIcon,
	HeartIcon,
} from "@solar-icons/react/linear";
import type { DevtoPayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function DevtoBlock({
	payload,
	themed = false,
}: {
	payload: DevtoPayload;
	themed?: boolean;
}) {
	if (payload.articles.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<SiDevdotto className="h-3.5 w-3.5" />
				Dev.to
			</h2>

			<div
				className={cx(
					"divide-y overflow-hidden rounded-xl border",
					themed
						? "tt-panel divide-(--tt-border)"
						: "divide-hairline border-hairline bg-surface",
				)}
			>
				{payload.articles.map((a) => (
					<a
						key={a.id}
						href={a.url}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"flex items-center justify-between gap-4 p-4 transition-colors",
							themed ? "hover:opacity-90" : "hover:bg-surface-elevated",
						)}
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{a.title}</p>
							<div
								className={cx(
									"mt-1 flex flex-wrap items-center gap-3 text-[11px]",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								<span className="inline-flex items-center gap-1">
									<HeartIcon size={12} className="h-3 w-3" />
									{a.reactions}
								</span>
								{a.page_views != null && (
									<span className="inline-flex items-center gap-1">
										<EyeIcon size={12} className="h-3 w-3" />
										{a.page_views}
									</span>
								)}
								<span className="inline-flex items-center gap-1">
									<ClockCircleIcon size={12} className="h-3 w-3" />
									{a.reading_time_minutes} min
								</span>
							</div>
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
