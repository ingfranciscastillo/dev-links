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
			className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		>
			{theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
		</button>
	);
}
