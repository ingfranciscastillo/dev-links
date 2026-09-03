import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Mismo token de easing que Hero/RevealSection — la entrada de los
// h1 de página comparte vocabulario de motion con el resto del sitio.
const ease = [0.16, 1, 0.3, 1] as const;

export function PageTitle({
	className,
	children,
}: {
	className?: string;
	children: ReactNode;
}) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.h1
			className={className}
			initial={
				reduceMotion ? false : { opacity: 0, y: 14, filter: "blur(4px)" }
			}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			transition={{ duration: reduceMotion ? 0.01 : 0.5, ease }}
		>
			{children}
		</motion.h1>
	);
}
