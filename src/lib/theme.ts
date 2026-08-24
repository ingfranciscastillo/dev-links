// Tiny theme helper for class-based dark mode with no-flash hydration.
export const THEME_STORAGE_KEY = "devlinks-theme";

export const noFlashThemeScript = `
(function(){try{
  var k='${THEME_STORAGE_KEY}';
  var t=localStorage.getItem(k);
  if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'dark';}
  if(t==='dark'){document.documentElement.classList.add('dark');}
}catch(e){document.documentElement.classList.add('dark');}})();
`.trim();

export type Theme = "light" | "dark";

export function getTheme(): Theme {
	if (typeof document === "undefined") return "dark";
	return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme) {
	if (typeof document === "undefined") return;
	const root = document.documentElement;
	if (theme === "dark") root.classList.add("dark");
	else root.classList.remove("dark");
	try {
		localStorage.setItem(THEME_STORAGE_KEY, theme);
	} catch {}
}
