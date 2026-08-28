import { SiWakatime } from "@icons-pack/react-simple-icons";
import type { WakatimePayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

export function WakatimeBlock({
	payload,
	themed = false,
}: {
	payload: WakatimePayload;
	themed?: boolean;
}) {
	if (payload.languages.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<SiWakatime className="h-3.5 w-3.5" /> Coding time
			</h2>
			<div
				className={cx(
					"rounded-xl border p-5",
					themed ? "tt-panel" : "border-hairline bg-surface",
				)}
			>
				<div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
					<p className="text-2xl font-semibold tracking-tight">
						{payload.total_human}
					</p>
					<p
						className={cx(
							"text-xs",
							themed ? "tt-muted" : "text-muted-foreground",
						)}
					>
						last 7 days · {payload.daily_average_human}/day avg
					</p>
				</div>
				<ul className="mt-4 space-y-2">
					{payload.languages.map((l) => (
						<li key={l.name} className="text-xs">
							<div className="flex items-center justify-between">
								<span className="font-medium">{l.name}</span>
								<span className={themed ? "tt-muted" : "text-muted-foreground"}>
									{l.text}
								</span>
							</div>
							<div
								className={cx(
									"mt-1 h-1.5 overflow-hidden rounded-full",
									!themed && "bg-background",
								)}
								style={themed ? { background: "var(--tt-border)" } : undefined}
							>
								<div
									className={cx("h-full rounded-full", !themed && "bg-brand")}
									style={{
										width: `${Math.min(100, l.percent)}%`,
										background: themed ? "var(--tt-accent)" : undefined,
									}}
								/>
							</div>
						</li>
					))}
				</ul>
				{payload.editors.length > 0 && (
					<p
						className={cx(
							"mt-4 text-[11px]",
							themed ? "tt-muted" : "text-muted-foreground",
						)}
					>
						Editors:{" "}
						{payload.editors.map((e) => `${e.name} ${e.percent}%`).join(" · ")}
					</p>
				)}
			</div>
		</section>
	);
}
