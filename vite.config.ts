import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";

import { tanstackStart } from "@tanstack/react-start/plugin/vite";

import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

const config = defineConfig(({ command }) => ({
	resolve: { tsconfigPaths: true },
	plugins: [
		devtools(),
		nitro({
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
