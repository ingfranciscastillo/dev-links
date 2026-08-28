import { SiBluesky } from "@icons-pack/react-simple-icons";
import { Heart, Repeat2 } from "lucide-react";
import type { BlueskyPayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function BlueskyBlock({
	payload,
	themed = false,
}: {
	payload: BlueskyPayload;
	themed?: boolean;
}) {
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiBluesky className="h-3.5 w-3.5" /> Bluesky
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
					{payload.profile.followers.toLocaleString()} followers
				</a>
			</h2>
			<div className="grid gap-2">
				{payload.posts.slice(0, 5).map((p) => (
					<a
						key={p.url}
						href={p.url}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"rounded-xl border p-4 transition-colors",
							themed
								? "tt-panel hover:opacity-90"
								: "border-hairline bg-surface hover:bg-surface-elevated",
						)}
					>
						<p className="whitespace-pre-line text-sm">{p.text}</p>
						<div
							className={cx(
								"mt-2 flex items-center gap-3 text-[11px]",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							<span className="inline-flex items-center gap-1">
								<Heart className="h-3 w-3" />
								{p.likes}
							</span>
							<span className="inline-flex items-center gap-1">
								<Repeat2 className="h-3 w-3" />
								{p.reposts}
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
