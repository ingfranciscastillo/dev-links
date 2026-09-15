import {
	bundledLanguages,
	createCssVariablesTheme,
	createHighlighter,
	type Highlighter,
} from "shiki";

// Genera el tema "css-variables": cada token trae un style="color:var(--shiki-*)"
// inline en vez de colores fijos, para que el resaltado herede la paleta del
// sitio (styles.css) o la del tema del creador (theme-config.ts) en vez de
// traer los colores fijos de un tema de editor.
const CSS_VARIABLES_THEME = createCssVariablesTheme({
	name: "css-variables",
	variablePrefix: "--shiki-",
	fontStyle: true,
});

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter() {
	if (!highlighterPromise) {
		highlighterPromise = createHighlighter({
			themes: [CSS_VARIABLES_THEME],
			langs: [],
		});
	}
	return highlighterPromise;
}

// Alias que la gente escribe a mano en el input de lenguaje del dashboard
// pero que Shiki no reconoce como id/alias propio.
const LANG_ALIASES: Record<string, string> = {
	node: "javascript",
	nodejs: "javascript",
	golang: "go",
	"c++": "cpp",
	"c#": "csharp",
	sh: "bash",
	shell: "bash",
	zsh: "bash",
	text: "text",
	plaintext: "text",
	plain: "text",
};

export async function highlightSnippet(
	code: string,
	rawLanguage: string,
): Promise<string> {
	const highlighter = await getHighlighter();
	const key = rawLanguage.trim().toLowerCase();
	const lang = LANG_ALIASES[key] ?? key;
	const supported = lang in bundledLanguages ? lang : "text";

	if (
		supported !== "text" &&
		!highlighter.getLoadedLanguages().includes(supported)
	) {
		try {
			await highlighter.loadLanguage(
				supported as keyof typeof bundledLanguages,
			);
		} catch {
			return highlighter.codeToHtml(code, {
				lang: "text",
				theme: "css-variables",
			});
		}
	}

	try {
		return highlighter.codeToHtml(code, {
			lang: supported,
			theme: "css-variables",
		});
	} catch {
		return highlighter.codeToHtml(code, {
			lang: "text",
			theme: "css-variables",
		});
	}
}
