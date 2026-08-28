import { z } from "zod";

// ---- Rich theme config (stored in themes.config jsonb) ----------------------

export const fontOptions = [
	{ value: "inter", label: "Inter", stack: "'Inter', system-ui, sans-serif" },
	{ value: "geist", label: "Geist", stack: "'Geist', 'Inter', sans-serif" },
	{ value: "manrope", label: "Manrope", stack: "'Manrope', sans-serif" },
	{
		value: "space-grotesk",
		label: "Space Grotesk",
		stack: "'Space Grotesk', sans-serif",
	},
	{
		value: "jetbrains",
		label: "JetBrains Mono",
		stack: "'JetBrains Mono', ui-monospace, monospace",
	},
	{
		value: "ibm-plex-mono",
		label: "IBM Plex Mono",
		stack: "'IBM Plex Mono', ui-monospace, monospace",
	},
	{ value: "fraunces", label: "Fraunces", stack: "'Fraunces', Georgia, serif" },
	{
		value: "system",
		label: "System",
		stack: "system-ui, -apple-system, sans-serif",
	},
] as const;

export type FontKey = (typeof fontOptions)[number]["value"];

export const themeV2Schema = z.object({
	// Colors
	bg: z.string(), // hex — page background
	fg: z.string(), // hex — text
	muted: z.string(), // muted text
	surface: z.string(), // cards
	border: z.string(), // borders
	accent: z.string(), // primary accent
	accent2: z.string().optional(), // for gradients

	// Background style
	bgStyle: z.enum(["solid", "gradient", "radial", "mesh", "grid", "dots"]),
	bgAngle: z.number().min(0).max(360).default(135),

	// Typography
	headingFont: z.string(), // FontKey or custom family
	bodyFont: z.string(),
	monoFont: z.string(),
	fontSizeScale: z.number().min(0.85).max(1.25).default(1),
	letterSpacing: z.number().min(-2).max(4).default(0), // px

	// Layout
	radius: z.number().min(0).max(32).default(12), // px
	cardPadding: z.number().min(8).max(40).default(16),
	cardWidth: z.enum(["narrow", "default", "wide"]).default("default"),
	spacing: z.number().min(0.75).max(1.5).default(1),

	// Effects
	shadow: z.enum(["none", "sm", "md", "lg", "glow"]).default("sm"),
	glass: z.boolean().default(false),
	hover: z.enum(["none", "lift", "glow", "scale", "shift"]).default("lift"),

	// Buttons
	buttonStyle: z
		.enum(["solid", "outline", "ghost", "gradient", "glass"])
		.default("solid"),
	buttonBorder: z.number().min(0).max(3).default(1),

	// Custom (Pro)
	customCss: z.string().max(8000).default(""),
});

export type ThemeV2 = z.infer<typeof themeV2Schema>;

export const defaultThemeV2: ThemeV2 = {
	bg: "#0a0a0a",
	fg: "#fafafa",
	muted: "#a1a1aa",
	surface: "#141414",
	border: "#262626",
	accent: "#7c5cff",
	accent2: "#22d3ee",
	bgStyle: "solid",
	bgAngle: 135,
	headingFont: "inter",
	bodyFont: "inter",
	monoFont: "jetbrains",
	fontSizeScale: 1,
	letterSpacing: 0,
	radius: 12,
	cardPadding: 16,
	cardWidth: "default",
	spacing: 1,
	shadow: "sm",
	glass: false,
	hover: "lift",
	buttonStyle: "solid",
	buttonBorder: 1,
	customCss: "",
};

export function parseThemeConfig(raw: unknown): ThemeV2 {
	const merged = {
		...defaultThemeV2,
		...(raw && typeof raw === "object" ? (raw as object) : {}),
	};
	const result = themeV2Schema.safeParse(merged);
	return result.success ? result.data : defaultThemeV2;
}

// ---- Legacy compat (used by dashboard/store) --------------------------------

export const bgOptions: {
	value: string;
	label: string;
	bg: string;
	fg: string;
}[] = [
	{ value: "dark", label: "Dark", bg: "#0a0a0a", fg: "#fafafa" },
	{ value: "midnight", label: "Midnight", bg: "#0b1220", fg: "#e2e8f0" },
	{ value: "light", label: "Light", bg: "#ffffff", fg: "#0a0a0a" },
	{ value: "paper", label: "Paper", bg: "#f5f2ec", fg: "#1a1a1a" },
];

export const radiusMap = {
	sharp: "0.25rem",
	soft: "0.75rem",
	round: "1.5rem",
} as const;

// ---- CSS generation ---------------------------------------------------------

function fontStack(key: string): string {
	const found = fontOptions.find((f) => f.value === key);
	return found?.stack ?? key;
}

/**
 * IMPORTANTE: background-color, background-image y background-size van
 * SEPARADOS (nunca concatenados en un solo shorthand `background: ...`).
 *
 * El bug anterior generaba algo como:
 *   "#0a0a0a linear-gradient(...) 0 0/24px 24px, #0a0a0a linear-gradient(...) ..."
 * Eso es CSS inválido: en el shorthand `background`, el color solo puede
 * aparecer UNA vez y en la ÚLTIMA capa de la lista separada por comas. Con
 * dos o más capas (grid, mesh) y un color pegado al principio, el navegador
 * descarta la declaración COMPLETA y no se pinta ningún fondo (de ahí el
 * "solo se ve blanco"). Separando las propiedades este problema desaparece
 * para cualquier combinación de capas.
 */
function backgroundColorValue(t: ThemeV2): string {
	return t.bg;
}

function backgroundImageValue(t: ThemeV2): string {
	const a = t.accent;
	const b = t.accent2 ?? t.accent;
	switch (t.bgStyle) {
		case "gradient":
			return `linear-gradient(${t.bgAngle}deg, ${t.bg} 0%, ${mix(t.bg, a, 0.25)} 100%)`;
		case "radial":
			return `radial-gradient(circle at 30% 20%, ${mix(t.bg, a, 0.3)} 0%, ${t.bg} 60%)`;
		case "mesh":
			return `radial-gradient(at 20% 10%, ${withAlpha(a, 0.35)} 0px, transparent 50%), radial-gradient(at 80% 0%, ${withAlpha(b, 0.25)} 0px, transparent 50%), radial-gradient(at 80% 90%, ${withAlpha(a, 0.2)} 0px, transparent 50%)`;
		case "grid":
			return `linear-gradient(${withAlpha(t.fg, 0.06)} 1px, transparent 1px), linear-gradient(90deg, ${withAlpha(t.fg, 0.06)} 1px, transparent 1px)`;
		case "dots":
			return `radial-gradient(${withAlpha(t.fg, 0.1)} 1px, transparent 1px)`;
		default:
			return "none";
	}
}

function backgroundSizeValue(t: ThemeV2): string {
	switch (t.bgStyle) {
		case "grid":
			return "24px 24px, 24px 24px";
		case "dots":
			return "18px 18px";
		default:
			return "auto";
	}
}

function shadowValue(t: ThemeV2): string {
	switch (t.shadow) {
		case "none":
			return "none";
		case "sm":
			return "0 1px 2px rgba(0,0,0,.2)";
		case "md":
			return "0 6px 16px rgba(0,0,0,.25)";
		case "lg":
			return "0 20px 40px -12px rgba(0,0,0,.4)";
		case "glow":
			return `0 0 24px ${withAlpha(t.accent, 0.35)}`;
		default:
			return "none";
	}
}

/**
 * cardWidth controla el max-width del contenedor principal (.tt-container).
 * Los valores están pensados para el layout real del perfil: sidebar fijo
 * de 320px + gap de 32px en desktop.
 *   - narrow  -> layout de una sola columna (estilo link-in-bio clásico),
 *                el ancho aplica directo al contenido centrado.
 *   - default -> grid de dos columnas, deja ~728px para el contenido.
 *   - wide    -> grid de dos columnas, deja ~968px para el contenido.
 * (El cambio a una columna cuando cardWidth === "narrow" se hace en
 * $username.tsx, no acá — esta función solo calcula el ancho máximo.)
 */
function maxWidth(t: ThemeV2): string {
	return t.cardWidth === "narrow"
		? "640px"
		: t.cardWidth === "wide"
			? "1320px"
			: "1080px";
}

export function themeToCssVars(t: ThemeV2): Record<string, string> {
	return {
		"--tt-bg": backgroundColorValue(t),
		"--tt-bg-image": backgroundImageValue(t),
		"--tt-bg-size": backgroundSizeValue(t),
		"--tt-fg": t.fg,
		"--tt-muted": t.muted,
		"--tt-surface": t.surface,
		"--tt-border": t.border,
		"--tt-accent": t.accent,
		"--tt-accent-2": t.accent2 ?? t.accent,
		"--tt-radius": `${t.radius}px`,
		"--tt-card-padding": `${t.cardPadding}px`,
		"--tt-spacing": `${t.spacing}`,
		"--tt-max-width": maxWidth(t),
		"--tt-heading-font": fontStack(t.headingFont),
		"--tt-body-font": fontStack(t.bodyFont),
		"--tt-mono-font": fontStack(t.monoFont),
		"--tt-font-scale": `${t.fontSizeScale}`,
		"--tt-tracking": `${t.letterSpacing / 100}em`,
		"--tt-shadow": shadowValue(t),
		"--tt-btn-border": `${t.buttonBorder}px`,
	};
}

export function themeToStyleTag(t: ThemeV2, scope = ".tt-scope"): string {
	const vars = themeToCssVars(t);
	const body = Object.entries(vars)
		.map(([k, v]) => `  ${k}: ${v};`)
		.join("\n");
	const glass = t.glass
		? `${scope} .tt-card { background: ${withAlpha(t.surface, 0.55)}; backdrop-filter: blur(14px) saturate(140%); border-color: ${withAlpha(t.fg, 0.1)}; }`
		: "";
	const hover = hoverCss(t.hover, scope);
	const btn = buttonCss(t, scope);
	const custom = sanitizeCss(t.customCss);

	// Reglas de "scope" — compiten directamente con clases Tailwind de igual
	// especificidad (bg-background, text-foreground) aplicadas en el mismo
	// elemento en $username.tsx. Con !important garantizamos que el tema del
	// creador siempre gane, sin depender del orden de carga del CSS.
	const scopeBase = `${scope} { background-color: var(--tt-bg) !important; background-image: var(--tt-bg-image) !important; background-repeat: repeat !important; background-position: 0 0 !important; background-size: var(--tt-bg-size) !important; color: var(--tt-fg) !important; font-family: var(--tt-body-font) !important; letter-spacing: var(--tt-tracking); }`;
	const headings = `${scope} h1, ${scope} h2, ${scope} h3 { font-family: var(--tt-heading-font) !important; }`;
	const monoEls = `${scope} code, ${scope} pre { font-family: var(--tt-mono-font) !important; }`;

	const card = `${scope} .tt-card { background: var(--tt-surface); border: 1px solid var(--tt-border); border-radius: var(--tt-radius); padding: var(--tt-card-padding); box-shadow: var(--tt-shadow); font-size: calc(0.9375rem * var(--tt-font-scale)); transition: transform .18s ease, box-shadow .18s ease, background .18s ease; }`;

	// Utilidades genéricas para que TODAS las secciones del perfil (no solo
	// los links) puedan pedir explícitamente los colores del tema en vez de
	// heredar por cascada.
	const muted = `${scope} .tt-muted { color: var(--tt-muted) !important; }`;
	const surface = `${scope} .tt-surface { background: var(--tt-surface) !important; }`;
	const borderC = `${scope} .tt-border-c { border-color: var(--tt-border) !important; }`;
	const panel = `${scope} .tt-panel { background: var(--tt-surface) !important; border-color: var(--tt-border) !important; }`;

	const container = `${scope} .tt-container { max-width: var(--tt-max-width); margin-inline: auto; }`;

	return `${scope} {\n${body}\n}\n${scopeBase}\n${headings}\n${monoEls}\n${card}\n${muted}\n${surface}\n${borderC}\n${panel}\n${container}\n${glass}\n${hover}\n${btn}\n${custom}`;
}

function hoverCss(kind: ThemeV2["hover"], scope: string): string {
	switch (kind) {
		case "lift":
			return `${scope} .tt-card:hover { transform: translateY(-2px); box-shadow: var(--tt-shadow), 0 8px 20px rgba(0,0,0,.2); }`;
		case "glow":
			return `${scope} .tt-card:hover { box-shadow: 0 0 0 1px var(--tt-accent), 0 0 24px color-mix(in oklab, var(--tt-accent) 40%, transparent); }`;
		case "scale":
			return `${scope} .tt-card:hover { transform: scale(1.02); }`;
		case "shift":
			return `${scope} .tt-card:hover { transform: translateX(4px); }`;
		default:
			return "";
	}
}

function buttonCss(t: ThemeV2, scope: string): string {
	const base = `${scope} .tt-btn { display:flex; align-items:center; gap:.75rem; padding: calc(var(--tt-card-padding) * .8) var(--tt-card-padding); border-radius: var(--tt-radius); font-weight:500; font-size: calc(0.9375rem * var(--tt-font-scale)); transition: all .18s ease; text-decoration:none; }`;
	switch (t.buttonStyle) {
		case "solid":
			return `${base}\n${scope} .tt-btn { background: var(--tt-accent); color: ${contrastOn(t.accent)}; border: var(--tt-btn-border) solid transparent; }\n${scope} .tt-btn:hover { opacity: .92; }`;
		case "outline":
			return `${base}\n${scope} .tt-btn { background: transparent; color: var(--tt-fg); border: var(--tt-btn-border) solid var(--tt-accent); }\n${scope} .tt-btn:hover { background: color-mix(in oklab, var(--tt-accent) 12%, transparent); }`;
		case "ghost":
			return `${base}\n${scope} .tt-btn { background: transparent; color: var(--tt-fg); border: var(--tt-btn-border) solid var(--tt-border); }\n${scope} .tt-btn:hover { background: var(--tt-surface); }`;
		case "gradient":
			return `${base}\n${scope} .tt-btn { background: linear-gradient(90deg, var(--tt-accent), var(--tt-accent-2)); color: ${contrastOn(t.accent)}; border: none; }\n${scope} .tt-btn:hover { filter: brightness(1.05); }`;
		case "glass":
			return `${base}\n${scope} .tt-btn { background: ${withAlpha(t.fg, 0.08)}; color: var(--tt-fg); border: var(--tt-btn-border) solid ${withAlpha(t.fg, 0.15)}; backdrop-filter: blur(10px); }\n${scope} .tt-btn:hover { background: ${withAlpha(t.fg, 0.14)}; }`;
	}
}

// ---- Color helpers ----------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
	const h = hex.replace("#", "");
	const v =
		h.length === 3
			? h
					.split("")
					.map((c) => c + c)
					.join("")
			: h;
	const n = parseInt(v || "000000", 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function withAlpha(hex: string, a: number): string {
	const [r, g, b] = hexToRgb(hex);
	return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function mix(a: string, b: string, t: number): string {
	const [r1, g1, b1] = hexToRgb(a);
	const [r2, g2, b2] = hexToRgb(b);
	const r = Math.round(r1 + (r2 - r1) * t);
	const g = Math.round(g1 + (g2 - g1) * t);
	const bl = Math.round(b1 + (b2 - b1) * t);
	return `rgb(${r}, ${g}, ${bl})`;
}

export function contrastOn(hex: string): string {
	const [r, g, b] = hexToRgb(hex);
	const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return lum > 0.6 ? "#0a0a0a" : "#ffffff";
}

// Strip anything that could break out of the scoped style block.
function sanitizeCss(css: string): string {
	if (!css) return "";
	return css
		.replace(/<\/style>/gi, "")
		.replace(/@import[^;]*;/gi, "")
		.replace(/expression\s*\(/gi, "")
		.replace(/javascript:/gi, "")
		.slice(0, 8000);
}
