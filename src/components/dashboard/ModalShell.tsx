import { X } from "lucide-react";
import type { ReactNode } from "react";

export function ModalShell({
	title,
	onClose,
	children,
}: {
	title: string;
	onClose: () => void;
	children: ReactNode;
}) {
	return (
		<div
			className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
			role="presentation"
		>
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				onClick={onClose}
				aria-label="Close modal"
			/>
			<div
				className="relative z-10 w-full max-w-md border border-border bg-background p-6 sm:p-7"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
			>
				<div className="flex items-start justify-between gap-6 border-b border-border pb-4">
					<div>
						<p className="font-mono text-[9px] uppercase tracking-[0.14em] text-brand">
							DevLinks
						</p>

						<h2
							id="modal-title"
							className="mt-2 font-display text-2xl tracking-tight"
						>
							{title}
						</h2>
					</div>

					<button
						type="button"
						onClick={onClose}
						className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						aria-label="Close"
					>
						<X className="h-4 w-4" strokeWidth={1.5} />
					</button>
				</div>

				<div className="pt-6">{children}</div>
			</div>
		</div>
	);
}
