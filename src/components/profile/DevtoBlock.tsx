import { ArrowUpRight, Clock, Eye, Heart } from "lucide-react";
import type { DevtoPayload } from "@/lib/integrations/types";

export function DevtoBlock({ payload }: { payload: DevtoPayload }) {
	if (payload.articles.length === 0) return null;
	return (
		<section>
			<h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
				Dev.to
			</h2>
			<div className="grid gap-2">
				{payload.articles.map((a) => (
					<a
						key={a.id}
						href={a.url}
						target="_blank"
						rel="noreferrer"
						className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-elevated"
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{a.title}</p>
							<div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
								<span className="inline-flex items-center gap-1">
									<Heart className="h-3 w-3" />
									{a.reactions}
								</span>
								{a.page_views != null && (
									<span className="inline-flex items-center gap-1">
										<Eye className="h-3 w-3" />
										{a.page_views}
									</span>
								)}
								<span className="inline-flex items-center gap-1">
									<Clock className="h-3 w-3" />
									{a.reading_time_minutes} min
								</span>
							</div>
						</div>
						<ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
					</a>
				))}
			</div>
		</section>
	);
}
