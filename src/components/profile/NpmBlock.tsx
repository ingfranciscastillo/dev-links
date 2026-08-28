import { SiNpm } from "@icons-pack/react-simple-icons";
import { ArrowUpRight, Download, Package } from "lucide-react";
import type { NpmPayload } from "@/lib/integrations/types";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

function compact(n: number) {
	return Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

export function NpmBlock({
	payload,
	themed = false,
}: {
	payload: NpmPayload;
	themed?: boolean;
}) {
	if (payload.packages.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center justify-between text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<span className="flex items-center gap-2">
					<SiNpm className="h-3.5 w-3.5" /> npm packages
				</span>
				<span className="font-mono text-[11px] normal-case tracking-normal">
					{compact(payload.total_weekly_downloads)} /week
				</span>
			</h2>
			{/*
			  Misma estructura de caja única con divide-y que Dev.to/Medium:
			  nombre de paquete + descripción + fila de metadata (versión,
			  descargas semanales) es el mismo patrón que causaba desborde
			  cuando cada fila era una tarjeta individual con borde propio.
			*/}
			<div
				className={cx(
					"divide-y overflow-hidden rounded-xl border",
					themed
						? "tt-panel divide-(--tt-border)"
						: "divide-hairline border-hairline bg-surface",
				)}
			>
				{payload.packages.slice(0, 8).map((p) => (
					<a
						key={p.name}
						href={p.url}
						target="_blank"
						rel="noreferrer"
						className={cx(
							"flex items-center justify-between gap-4 p-4 transition-colors",
							themed ? "hover:opacity-90" : "hover:bg-surface-elevated",
						)}
					>
						<div className="min-w-0">
							<p className="truncate font-mono text-sm font-medium">{p.name}</p>
							{p.description && (
								<p
									className={cx(
										"mt-1 line-clamp-1 text-xs",
										themed ? "tt-muted" : "text-muted-foreground",
									)}
								>
									{p.description}
								</p>
							)}
							<div
								className={cx(
									"mt-1 flex items-center gap-3 text-[11px]",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								<span>v{p.version}</span>
								{p.weekly_downloads != null && (
									<span className="inline-flex items-center gap-1">
										<Download className="h-3 w-3" />
										{compact(p.weekly_downloads)}
									</span>
								)}
							</div>
						</div>
						<ArrowUpRight
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
