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
			className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-0 backdrop-blur sm:items-center sm:p-4"
			onClick={onClose}
		>
			<div
				className="w-full max-w-md rounded-t-2xl border border-hairline bg-surface p-6 shadow-2xl sm:rounded-2xl"
				onClick={(e) => e.stopPropagation()}
			>
				<div className="mb-4 flex items-center justify-between">
					<h2 className="text-base font-semibold">{title}</h2>
					<button
						type="button"
						onClick={onClose}
						className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
						aria-label="Close"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
