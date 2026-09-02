import { DangerCircleIcon } from "@solar-icons/react/linear";
import { Button } from "@/components/ui/button";
import { ModalShell } from "./ModalShell";

export function ConfirmDialog({
	title,
	description,
	confirmLabel = "Delete",
	pending = false,
	onConfirm,
	onClose,
}: {
	title: string;
	description: string;
	confirmLabel?: string;
	pending?: boolean;
	onConfirm: () => void;
	onClose: () => void;
}) {
	return (
		<ModalShell title={title} onClose={onClose}>
			<div className="flex items-start gap-4">
				<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-destructive/30 text-destructive">
					<DangerCircleIcon className="h-4 w-4" strokeWidth={1.5} />
				</div>

				<p className="text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			</div>

			<div className="mt-7 flex items-center justify-end gap-5 border-t border-border pt-5">
				<button
					type="button"
					onClick={onClose}
					disabled={pending}
					className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
				>
					Cancel
				</button>

				<Button
					variant="destructive"
					disabled={pending}
					onClick={onConfirm}
					className="h-10 rounded-none px-5 font-mono text-[10px] uppercase tracking-[0.08em] shadow-none"
				>
					{pending ? "Deleting…" : confirmLabel}
				</Button>
			</div>
		</ModalShell>
	);
}
