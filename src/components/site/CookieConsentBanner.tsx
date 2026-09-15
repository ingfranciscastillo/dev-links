import { Link } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import posthog from "posthog-js";
import { useEffect, useState } from "react";

export function CookieConsentBanner() {
	const reduceMotion = useReducedMotion();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		// has_opted_out_capturing() is NOT "the user chose no" — it also
		// returns true from opt_out_capturing_by_default (provider.tsx) before
		// anyone has made a choice, so the banner never showed. Confirmed by
		// reading posthog-js's own source: get_explicit_consent_status() is
		// the method it documents for exactly this — "whether the user has
		// made an explicit choice... to determine whether to show an initial
		// cookie banner." "pending" means no choice yet.
		if (!import.meta.env.VITE_POSTHOG_KEY) return;
		if (posthog.get_explicit_consent_status() !== "pending") return;
		setVisible(true);
	}, []);

	function accept() {
		posthog.opt_in_capturing();
		setVisible(false);
	}

	function reject() {
		posthog.opt_out_capturing();
		setVisible(false);
	}

	return (
		<AnimatePresence>
			{visible ? (
				<motion.div
					role="region"
					aria-label="Cookie consent"
					initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
					animate={{ opacity: 1, y: 0 }}
					exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
					transition={{ duration: reduceMotion ? 0.01 : 0.3 }}
					className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface"
				>
					<div className="mx-auto flex max-w-editorial flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
						<p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
							We use a strictly-necessary session cookie to keep you signed in,
							and (only with your OK) first-party product analytics to see which
							pages get used — no ads, no cross-site tracking. See the{" "}
							<Link
								to="/privacy"
								className="text-foreground underline decoration-border underline-offset-4 hover:decoration-brand"
							>
								Privacy Policy
							</Link>
							.
						</p>

						<div className="flex shrink-0 items-center gap-3">
							<button
								type="button"
								onClick={reject}
								className="h-9 px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
							>
								Essential only
							</button>
							<button
								type="button"
								onClick={accept}
								className="h-9 border border-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
							>
								Accept
							</button>
						</div>
					</div>
				</motion.div>
			) : null}
		</AnimatePresence>
	);
}
