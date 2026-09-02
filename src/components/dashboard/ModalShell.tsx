import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const EXIT_MS = 150;

export function ModalShell({
	title,
	onClose,
	children,
}: {
	title: string;
	onClose: () => void;
	children: ReactNode | ((requestClose: () => void) => ReactNode);
}) {
	const [closing, setClosing] = useState(false);

	function requestClose() {
		setClosing(true);
	}

	useEffect(() => {
		if (!closing) return;
		const timer = setTimeout(onClose, EXIT_MS);
		return () => clearTimeout(timer);
	}, [closing, onClose]);

	return (
		<div
			className={cn(
				"fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-0 backdrop-blur-sm transition-opacity duration-150 sm:items-center sm:p-4 motion-reduce:transition-none",
				closing ? "opacity-0" : "opacity-100",
			)}
			role="presentation"
		>
			<button
				type="button"
				className="absolute inset-0 cursor-default"
				onClick={requestClose}
				aria-label="Close modal"
			/>
			<div
				className={cn(
					"relative z-10 w-full max-w-md border border-border bg-background p-6 transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] starting:opacity-0 starting:translate-y-2 starting:scale-95 sm:p-7 motion-reduce:transition-none",
					closing
						? "translate-y-2 scale-95 opacity-0"
						: "translate-y-0 scale-100 opacity-100",
				)}
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
						onClick={requestClose}
						className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						aria-label="Close"
					>
						<X className="h-4 w-4" strokeWidth={1.5} />
					</button>
				</div>

				<div className="pt-6">
					{typeof children === "function" ? children(requestClose) : children}
				</div>
			</div>
		</div>
	);
}
