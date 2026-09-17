import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Mismo ease que PageTitle/RevealSection — un stat que cuenta hacia arriba
// comparte el mismo vocabulario de motion que el resto del dashboard.
const ease = [0.16, 1, 0.3, 1] as const;

export function AnimatedNumber({
	value,
	duration = 0.6,
	decimals = 0,
}: {
	value: number;
	duration?: number;
	decimals?: number;
}) {
	const reduceMotion = useReducedMotion();
	const [display, setDisplay] = useState(reduceMotion ? value : 0);
	const fromRef = useRef(reduceMotion ? value : 0);

	useEffect(() => {
		if (reduceMotion) {
			setDisplay(value);
			fromRef.current = value;
			return;
		}

		const controls = animate(fromRef.current, value, {
			duration,
			ease,
			onUpdate: setDisplay,
		});

		fromRef.current = value;
		return () => controls.stop();
		// biome-ignore lint/correctness/useExhaustiveDependencies: fromRef intentionally reads the previous value, not a dependency
	}, [value, duration, reduceMotion]);

	return (
		<>
			{display.toLocaleString(undefined, {
				minimumFractionDigits: decimals,
				maximumFractionDigits: decimals,
			})}
		</>
	);
}
