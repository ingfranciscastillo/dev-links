import { Mic, PlayCircle, Presentation } from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

// NOTA: campos en camelCase porque así es como getPublicProfile los envía
// (profileData.talks mapea r.slidesUrl / r.videoUrl directo desde drizzle).
// El tipo anterior usaba snake_case (slides_url/video_url), lo que hacía que
// t.slides_url siempre leyera undefined y los links de "Slides"/"Watch"
// nunca se mostraran aunque hubiera datos cargados.
export type TalkItem = {
	id: string;
	title: string;
	event: string;
	description: string;
	date: string | null;
	slidesUrl: string | null;
	videoUrl: string | null;
};

export function TalksBlock({
	talks,
	themed = false,
}: {
	talks: TalkItem[];
	themed?: boolean;
}) {
	if (talks.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<Mic className="h-3.5 w-3.5" /> Talks & slides
			</h2>
			<div
				className={cx(
					"divide-y overflow-hidden rounded-xl border",
					themed
						? "tt-panel divide-(--tt-border)"
						: "divide-hairline border-hairline bg-surface",
				)}
			>
				{talks.map((t) => (
					<article key={t.id} className="p-4">
						<div className="flex flex-wrap items-baseline justify-between gap-2">
							<p className="text-sm font-medium">{t.title}</p>
							{t.date && (
								<span
									className={cx(
										"font-mono text-[11px]",
										themed ? "tt-muted" : "text-muted-foreground",
									)}
								>
									{new Date(t.date).toLocaleDateString()}
								</span>
							)}
						</div>
						{t.event && (
							<p
								className={cx(
									"mt-0.5 text-xs",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								{t.event}
							</p>
						)}
						{t.description && (
							<p
								className={cx(
									"mt-2 text-xs",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								{t.description}
							</p>
						)}
						<div className="mt-3 flex flex-wrap gap-3 text-xs">
							{t.slidesUrl && (
								<a
									href={t.slidesUrl}
									target="_blank"
									rel="noreferrer"
									className={cx(
										"inline-flex items-center gap-1 transition-opacity",
										themed
											? "tt-muted hover:opacity-80"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<Presentation className="h-3.5 w-3.5" /> Slides
								</a>
							)}
							{t.videoUrl && (
								<a
									href={t.videoUrl}
									target="_blank"
									rel="noreferrer"
									className={cx(
										"inline-flex items-center gap-1 transition-opacity",
										themed
											? "tt-muted hover:opacity-80"
											: "text-muted-foreground hover:text-foreground",
									)}
								>
									<PlayCircle className="h-3.5 w-3.5" /> Watch
								</a>
							)}
						</div>
					</article>
				))}
			</div>
		</section>
	);
}
