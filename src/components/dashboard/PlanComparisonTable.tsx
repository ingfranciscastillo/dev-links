import { cn } from "@/lib/utils";

const ROWS = [
	{
		key: "usage",
		label: "Links, projects, snippets",
		free: "Up to 5 each",
		pro: "Unlimited",
	},
	{ key: "analytics", label: "Analytics", free: "—", pro: "Included" },
	{ key: "custom_css", label: "Custom CSS", free: "—", pro: "Included" },
	{
		key: "branding",
		label: "DevLinks branding",
		free: "Shown",
		pro: "Removed",
	},
] as const;

type RowKey = (typeof ROWS)[number]["key"];

// Chica y reusable en los 3 gates (límite de recursos, Analytics, Custom
// CSS) — la skill de paywalls marca "Feature Comparison" como componente
// central del paywall screen y ninguno de los tres lo tenía, solo texto
// corrido describiendo lo que se pierde.
export function PlanComparisonTable({ highlight }: { highlight?: RowKey }) {
	return (
		<div className="mt-6 border-t border-border">
			<div className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] gap-2 border-b border-border py-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
				<span>Feature</span>
				<span className="text-right">Free</span>
				<span className="text-right text-foreground">Pro</span>
			</div>

			{ROWS.map((row) => (
				<div
					key={row.key}
					className="grid grid-cols-[minmax(0,1fr)_5rem_5rem] gap-2 border-b border-border py-2.5 text-sm last:border-b-0"
				>
					<span
						className={cn(
							row.key === highlight
								? "font-medium text-foreground"
								: "text-muted-foreground",
						)}
					>
						{row.label}
					</span>

					<span className="text-right text-muted-foreground">{row.free}</span>
					<span className="text-right text-foreground">{row.pro}</span>
				</div>
			))}
		</div>
	);
}
