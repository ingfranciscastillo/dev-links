import { MoonIcon } from "@solar-icons/react/linear/moon";
import { SunIcon } from "@solar-icons/react/linear/sun";
import { useEffect, useState } from "react";

import { getTheme, setTheme, type Theme } from "@/lib/theme";

export function ThemeToggle() {
	const [theme, setLocal] = useState<Theme>("dark");

	useEffect(() => {
		setLocal(getTheme());
	}, []);

	const toggle = () => {
		const next: Theme = theme === "dark" ? "light" : "dark";

		setTheme(next);
		setLocal(next);
	};

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
			className="relative inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
		>
			<SunIcon
				size={15}
				strokeWidth={1.5}
				className={`absolute transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
					theme === "dark" ? "scale-100 opacity-100" : "scale-50 opacity-0"
				}`}
			/>
			<MoonIcon
				size={15}
				strokeWidth={1.5}
				className={`absolute transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
					theme === "dark" ? "scale-50 opacity-0" : "scale-100 opacity-100"
				}`}
			/>
		</button>
	);
}
