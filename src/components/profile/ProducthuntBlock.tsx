import { SiProducthunt } from "@icons-pack/react-simple-icons";
import { AltArrowUpIcon, ChatRoundIcon } from "@solar-icons/react/linear";
import type { ProductHuntPayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function ProducthuntBlock({
	payload,
	themed = false,
}: {
	payload: ProductHuntPayload;
	themed?: boolean;
}) {
	if (payload.posts.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiProducthunt className="h-3.5 w-3.5" /> Product Hunt
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
					@{payload.profile.username}
				</a>
			</h2>
			<div className="grid gap-2 sm:grid-cols-2">
				{payload.posts.map((p) => (
					<a
						key={p.id}
						href={sanitizeHref(p.url)}
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
							<p className="truncate font-mono text-sm font-medium">{p.name}</p>
							<span
								className={cx(
									"inline-flex shrink-0 items-center gap-1 text-[11px]",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								<AltArrowUpIcon className="h-3 w-3" />
								{p.votes}
							</span>
						</div>
						<p
							className={cx(
								"mt-1 line-clamp-2 text-xs",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							{p.tagline}
						</p>
						<div
							className={cx(
								"mt-2 flex items-center gap-3 text-[11px]",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							<span className="inline-flex items-center gap-1">
								<ChatRoundIcon className="h-3 w-3" />
								{p.comments}
							</span>
							{p.created_at && (
								<span>{new Date(p.created_at).toLocaleDateString()}</span>
							)}
						</div>
					</a>
				))}
			</div>
		</section>
	);
}
