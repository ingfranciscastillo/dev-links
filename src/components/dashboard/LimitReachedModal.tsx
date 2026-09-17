import { LockKeyholeIcon } from "@solar-icons/react/linear";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { startProCheckout } from "@/lib/billing";
import { ModalShell } from "./ModalShell";

const ease = [0.16, 1, 0.3, 1] as const;

const RESOURCE_LABEL = {
	links: "links",
	projects: "projects",
	snippets: "snippets",
} as const;

// Se abre al hacer click en "New X" con el plan free en su límite, en vez de
// dejar el botón disabled con un title nativo — ese estado era casi invisible
// y no explicaba qué gana el usuario subiendo a Pro (ver growth-plan.md #4:
// mismo espíritu de hacer el upsell explícito en vez de pasivo).
export function LimitReachedModal({
	resource,
	limit,
	onClose,
}: {
	resource: keyof typeof RESOURCE_LABEL;
	limit: number;
	onClose: () => void;
}) {
	const reduceMotion = useReducedMotion();
	const [pending, setPending] = useState(false);

	async function handleUpgrade() {
		setPending(true);
		try {
			await startProCheckout();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Couldn't start checkout",
			);
			setPending(false);
		}
	}

	const label = RESOURCE_LABEL[resource];

	return (
		<ModalShell title="Free plan limit reached." onClose={onClose}>
			{(requestClose) => (
				<>
					<div className="flex items-start gap-4">
						<div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center border border-border text-brand">
							<LockKeyholeIcon className="h-4 w-4" strokeWidth={1.5} />
						</div>

						<p className="text-sm leading-relaxed text-muted-foreground">
							You're using all {limit} {label} on the Free plan. Pro removes the
							limit — plus custom CSS, analytics, and no DevLinks branding.
						</p>
					</div>

					<div className="mt-6">
						<div className="h-1 w-full overflow-hidden bg-surface">
							<motion.div
								className="h-full bg-brand"
								initial={{ width: 0 }}
								animate={{ width: "100%" }}
								transition={{ duration: reduceMotion ? 0.01 : 0.5, ease }}
							/>
						</div>

						<p className="mt-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
							{limit}/{limit} {label} used
						</p>
					</div>

					<div className="mt-7 flex items-center justify-end gap-5 border-t border-border pt-5">
						<button
							type="button"
							onClick={requestClose}
							disabled={pending}
							className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
						>
							Maybe later
						</button>

						<Button
							onClick={handleUpgrade}
							disabled={pending}
							className="h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
						>
							{pending ? "Redirecting…" : "Upgrade to Pro — $5/mo"}
						</Button>
					</div>
				</>
			)}
		</ModalShell>
	);
}
