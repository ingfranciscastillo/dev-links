import { SiHuggingface } from "@icons-pack/react-simple-icons";
import { ArrowRightUpIcon, HeartIcon } from "@solar-icons/react/linear";
import type { HuggingfacePayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

function compact(n: number) {
	return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export function HuggingfaceBlock({
	payload,
	themed = false,
}: {
	payload: HuggingfacePayload;
	themed?: boolean;
}) {
	if (payload.models.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiHuggingface className="h-3.5 w-3.5" /> Hugging Face
				</span>
				<a
					href={sanitizeHref(payload.profile.url)}
					target="_blank"
					rel="noreferrer"
					className={cx(
						"font-mono text-[11px] normal-case tracking-normal transition-opacity",
						themed ? "hover:opacity-80" : "hover:text-foreground",
					)}
				>
					{compact(payload.profile.followers)} followers
				</a>
			</h2>
			<div
				className={cx(
					"divide-y overflow-hidden rounded-xl border",
					themed
						? "tt-panel divide-(--tt-border)"
						: "divide-hairline border-hairline bg-surface",
				)}
			>
				{payload.models.map((m) => (
					<a
						key={m.id}
						href={sanitizeHref(m.url)}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"flex items-center justify-between gap-4 p-4 transition-colors",
							themed ? "hover:opacity-90" : "hover:bg-surface-elevated",
						)}
					>
						<div className="min-w-0">
							<p className="truncate font-mono text-sm font-medium">{m.name}</p>
							<div
								className={cx(
									"mt-1 flex items-center gap-3 text-[11px]",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								{m.pipeline_tag && <span>{m.pipeline_tag}</span>}
								<span className="inline-flex items-center gap-1">
									<HeartIcon className="h-3 w-3" />
									{compact(m.likes)}
								</span>
								<span>{compact(m.downloads)} downloads</span>
							</div>
						</div>
						<ArrowRightUpIcon
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
