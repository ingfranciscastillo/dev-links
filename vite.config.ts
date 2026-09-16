import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig, loadEnv } from "vite";

function getHttpsOrigin(value: string | undefined) {
	if (!value) return null;

	try {
		const url = new URL(value);

		if (url.protocol !== "https:") {
			return null;
		}

		return url.origin;
	} catch {
		return null;
	}
}

function buildCsp(env: Record<string, string>) {
	const imgHosts = [
		"'self'",
		"data:",
		"https://avatars.githubusercontent.com",
		"https://lh3.googleusercontent.com",
		"https://i.ytimg.com",
	];

	const r2Origin = getHttpsOrigin(env.R2_PUBLIC_URL);

	if (r2Origin) {
		imgHosts.push(r2Origin);
	}

	const connectHosts = [
		"'self'",
		"https://us.i.posthog.com",
		"https://us-assets.i.posthog.com",
	];

	const posthogOrigin = getHttpsOrigin(env.VITE_POSTHOG_HOST);

	if (posthogOrigin) {
		connectHosts.push(posthogOrigin);
	}

	return [
		"default-src 'self'",

		// TanStack Start currently requires inline scripts for
		// SSR hydration and route bootstrap payloads.
		"script-src 'self' 'unsafe-inline' https://us-assets.i.posthog.com",

		// Dynamic server-rendered styles are currently required
		// by the application's theme/editor system.
		"style-src 'self' 'unsafe-inline'",

		`img-src ${imgHosts.join(" ")}`,

		"font-src 'self'",

		`connect-src ${connectHosts.join(" ")}`,

		// The application must never be embedded in a frame.
		"frame-ancestors 'none'",
		"frame-src 'none'",

		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	].join("; ");
}

function buildSecurityHeaders(env: Record<string, string>) {
	return {
		// One year. includeSubDomains intentionally omitted because
		// not every subdomain is guaranteed to be HTTPS-only.
		"Strict-Transport-Security": "max-age=31536000",

		"X-Content-Type-Options": "nosniff",

		"X-Frame-Options": "DENY",

		"Referrer-Policy": "strict-origin-when-cross-origin",

		"Permissions-Policy": "geolocation=(), camera=(), microphone=()",

		"Content-Security-Policy": buildCsp(env),
	};
}

const config = defineConfig(({ command, mode }) => {
	// vite.config.ts runs outside Vite's client env pipeline,
	// so load the environment explicitly.
	const env = loadEnv(mode, process.cwd(), "");

	return {
		resolve: {
			tsconfigPaths: true,
		},

		plugins: [
			// enforce: "pre" is required when combined with @vitejs/plugin-react —
			// MDX must compile .mdx to JSX before react's own transform runs.
			{ enforce: "pre", ...mdx() },

			devtools(),

			nitro({
				routeRules: {
					"/**": {
						headers: buildSecurityHeaders(env),
					},
				},

				rollupConfig: {
					external: [/^@sentry\//],

					// Vercel serverless functions can have runtime issues
					// resolving Nitro's dynamically generated chunks.
					// Inline them during production builds.
					output: {
						inlineDynamicImports: command === "build",
					},
				},
			}),
			tailwindcss(),
			tanstackStart(),
			viteReact({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
		],
	};
});

export default config;
