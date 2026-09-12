import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// script-src hash for src/lib/theme.ts's noFlashThemeScript — the only
// inline <script> in the app (rendered via <ScriptOnce>, which appends
// ';document.currentScript.remove()'). Recompute if that script changes:
//   node -e "console.log('sha256-' + require('crypto').createHash('sha256').update(SCRIPT_PLUS_SUFFIX).digest('base64'))"
const NO_FLASH_SCRIPT_HASH =
	"sha256-Vo2lP5pYRnsbZANT0D2trsq1EtZAoZ3rNgWlmO/8c+U=";

function buildCsp() {
	const imgHosts = [
		"'self'",
		"data:",
		"https://avatars.githubusercontent.com",
		"https://lh3.googleusercontent.com",
		"https://i.ytimg.com",
	];
	if (process.env.R2_PUBLIC_URL) imgHosts.push(process.env.R2_PUBLIC_URL);

	const connectHosts = [
		"'self'",
		"https://us.i.posthog.com",
		"https://us-assets.i.posthog.com",
	];
	if (
		process.env.VITE_POSTHOG_HOST &&
		/^https?:\/\//.test(process.env.VITE_POSTHOG_HOST)
	) {
		connectHosts.push(process.env.VITE_POSTHOG_HOST);
	}

	return [
		"default-src 'self'",
		`script-src 'self' '${NO_FLASH_SCRIPT_HASH}'`,
		// 'unsafe-inline': per-user/per-theme <style> tags (profile theme, chart
		// theming, theme editor preview) are generated server-side with dynamic
		// content, so they can't be pinned by a static hash without adding
		// per-request CSP nonce plumbing through the SSR entry (not done yet).
		"style-src 'self' 'unsafe-inline'",
		`img-src ${imgHosts.join(" ")}`,
		"font-src 'self'",
		`connect-src ${connectHosts.join(" ")}`,
		"frame-ancestors 'self'",
		"frame-src 'none'",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	].join("; ");
}

const securityHeaders = {
	// includeSubDomains omitted: not every subdomain of the configured
	// site domain is confirmed to serve HTTPS-only content.
	"Strict-Transport-Security": "max-age=31536000",
	"X-Content-Type-Options": "nosniff",
	"X-Frame-Options": "DENY",
	"Referrer-Policy": "strict-origin-when-cross-origin",
	"Permissions-Policy": "geolocation=(), camera=(), microphone=()",
	"Content-Security-Policy": buildCsp(),
};

const config = defineConfig(({ command }) => ({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({
			routeRules: {
				"/**": { headers: securityHeaders },
			},
			rollupConfig: {
				external: [/^@sentry\//],
				// En Vercel (funciones serverless) los chunks de import() dinámico
				// generados por nitro no siempre resuelven en runtime — el server
				// crashea con 500 en cualquier ruta. Inlinear todo en un solo
				// bundle en build evita el problema (visto antes en otro proyecto).
				output: { inlineDynamicImports: command === "build" },
			},
		}),
		tailwindcss(),
		tanstackStart(),
		viteReact(),
	],
}));

export default config;
