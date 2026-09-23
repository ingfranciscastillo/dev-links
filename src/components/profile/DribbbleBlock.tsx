import { SiDribbble } from "@icons-pack/react-simple-icons";
import { EyeIcon, HeartIcon } from "@solar-icons/react/linear";
import type { DribbblePayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function DribbbleBlock({
	payload,
	themed = false,
}: {
	payload: DribbblePayload;
	themed?: boolean;
}) {
	if (payload.shots.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiDribbble className="h-3.5 w-3.5" /> Dribbble
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
				{payload.shots.map((s) => (
					<a
						key={s.id}
						href={sanitizeHref(s.url)}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"overflow-hidden rounded-xl border transition-colors",
							themed
								? "tt-panel hover:opacity-90"
								: "border-hairline bg-surface hover:bg-surface-elevated",
						)}
					>
						{s.image && (
							<img
								src={s.image}
								alt={s.title}
								className="aspect-video w-full object-cover"
							/>
						)}
						<div className="p-4">
							<p className="truncate font-mono text-sm font-medium">
								{s.title}
							</p>
							<div
								className={cx(
									"mt-2 flex items-center gap-3 text-[11px]",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								<span className="inline-flex items-center gap-1">
									<HeartIcon className="h-3 w-3" />
									{s.likes}
								</span>
								<span className="inline-flex items-center gap-1">
									<EyeIcon className="h-3 w-3" />
									{s.views}
								</span>
							</div>
						</div>
					</a>
				))}
			</div>
		</section>
	);
}
