import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

function buildCsp(env: Record<string, string>) {
	const imgHosts = [
		"'self'",
		"data:",
		"https://avatars.githubusercontent.com",
		"https://lh3.googleusercontent.com",
		"https://i.ytimg.com",
	];
	if (env.R2_PUBLIC_URL) imgHosts.push(env.R2_PUBLIC_URL);

	const connectHosts = [
		"'self'",
		"https://us.i.posthog.com",
		"https://us-assets.i.posthog.com",
	];
	if (env.VITE_POSTHOG_HOST && /^https?:\/\//.test(env.VITE_POSTHOG_HOST)) {
		connectHosts.push(env.VITE_POSTHOG_HOST);
	}

	return [
		"default-src 'self'",
		// 'unsafe-inline' on script-src: TanStack Start injects several inline
		// <script> tags per request (hydration/route bootstrap payload, e.g.
		// window.$_TSR), with content that differs every render — a static
		// hash can't pin them, and this TanStack Start version has no built-in
		// per-request CSP nonce plumbing to do it properly. 'self' still blocks
		// loading any *external* script not in this allowlist.
		"script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com",
		// 'unsafe-inline' on style-src: per-user/per-theme <style> tags (profile
		// theme, chart theming, theme editor preview) are generated server-side
		// with dynamic content, so they can't be pinned by a static hash either.
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

function buildSecurityHeaders(env: Record<string, string>) {
	return {
		// includeSubDomains omitted: not every subdomain of the configured
		// site domain is confirmed to serve HTTPS-only content.
		"Strict-Transport-Security": "max-age=31536000",
		"X-Content-Type-Options": "nosniff",
		"X-Frame-Options": "DENY",
		"Referrer-Policy": "strict-origin-when-cross-origin",
		"Permissions-Policy": "geolocation=(), camera=(), microphone=()",
		"Content-Security-Policy": buildCsp(env),
	};
}

const config = defineConfig(({ command, mode }) => {
	// vite.config.ts runs outside the client env pipeline, so .env values
	// (R2_PUBLIC_URL, VITE_POSTHOG_HOST) aren't in process.env here unless
	// explicitly loaded — needed to build an accurate CSP img-src/connect-src.
	const env = loadEnv(mode, process.cwd(), "");

	return {
		resolve: { tsconfigPaths: true },
		plugins: [
			devtools(),
			nitro({
				routeRules: {
					"/**": { headers: buildSecurityHeaders(env) },
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
	};
});

export default config;
