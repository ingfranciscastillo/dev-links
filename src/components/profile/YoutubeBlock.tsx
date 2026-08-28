import { SiYoutube } from "@icons-pack/react-simple-icons";
import type { YoutubePayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function YoutubeBlock({
	payload,
	themed = false,
}: {
	payload: YoutubePayload;
	themed?: boolean;
}) {
	if (payload.videos.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiYoutube className="h-3.5 w-3.5" /> Videos & talks
				</span>
				<a
					href={payload.channel.url}
					target="_blank"
					rel="noreferrer"
					className={cx(
						"text-[11px] normal-case tracking-normal transition-opacity",
						themed ? "hover:opacity-80" : "hover:text-foreground",
					)}
				>
					{payload.channel.title}
				</a>
			</h2>
			<div className="grid gap-3 sm:grid-cols-2">
				{payload.videos.slice(0, 6).map((v) => (
					<a
						key={v.url}
						href={v.url}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"overflow-hidden rounded-xl border transition-colors",
							themed
								? "tt-panel hover:opacity-90"
								: "border-hairline bg-surface hover:bg-surface-elevated",
						)}
					>
						{v.thumbnail && (
							<img
								src={v.thumbnail}
								alt={v.title}
								loading="lazy"
								className="aspect-video w-full object-cover"
							/>
						)}
						<div className="p-4">
							<p className="line-clamp-2 text-sm font-medium">{v.title}</p>
							{v.published_at && (
								<p
									className={cx(
										"mt-1 text-[11px]",
										themed ? "tt-muted" : "text-muted-foreground",
									)}
								>
									{new Date(v.published_at).toLocaleDateString()}
								</p>
							)}
						</div>
					</a>
				))}
			</div>
		</section>
	);
}
