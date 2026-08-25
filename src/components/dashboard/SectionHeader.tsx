import type { ReactNode } from "react";

export function SectionHeader({
	eyebrow,
	title,
	description,
	action,
}: {
	eyebrow: string;
	title: string;
	description?: string;
	action?: ReactNode;
}) {
	return (
		<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
			<div>
				<p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
					{eyebrow}
				</p>
				<h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
				{description ? (
					<p className="mt-1 text-sm text-muted-foreground">{description}</p>
				) : null}
			</div>
			{action}
		</div>
	);
}

export function EmptyState({
	icon: Icon,
	title,
	description,
	action,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	description: string;
	action?: ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface/40 py-16 text-center">
			<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated text-muted-foreground">
				<Icon className="h-5 w-5" />
			</div>
			<h3 className="text-base font-semibold">{title}</h3>
			<p className="mt-1 max-w-sm text-sm text-muted-foreground">
				{description}
			</p>
			{action ? <div className="mt-4">{action}</div> : null}
		</div>
	);
}
