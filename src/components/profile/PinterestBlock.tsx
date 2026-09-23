import { SiPinterest } from "@icons-pack/react-simple-icons";
import type { PinterestPayload } from "@/lib/integrations/types";
import { sanitizeHref } from "@/lib/safe-url";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function PinterestBlock({
	payload,
	themed = false,
}: {
	payload: PinterestPayload;
	themed?: boolean;
}) {
	if (payload.pins.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiPinterest className="h-3.5 w-3.5" /> Pinterest
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
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{payload.pins.map((p) => (
					<a
						key={p.id}
						href={sanitizeHref(p.url)}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"block overflow-hidden rounded-xl border transition-colors",
							themed
								? "tt-panel hover:opacity-90"
								: "border-hairline bg-surface hover:bg-surface-elevated",
						)}
					>
						{p.image ? (
							<img
								src={p.image}
								alt={p.title ?? "Pin"}
								className="aspect-square w-full object-cover"
							/>
						) : (
							<div className="flex aspect-square items-center justify-center p-3">
								<p className="line-clamp-4 text-center text-xs">{p.title}</p>
							</div>
						)}
					</a>
				))}
			</div>
		</section>
	);
}
