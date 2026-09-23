import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Standalone on purpose: vite.config.ts pulls in the TanStack Start/Nitro
// plugins, which the unit tests don't need. Only the path aliases are shared.
const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
	resolve: {
		alias: {
			"@": src,
			"#": src,
		},
	},
	test: {
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
});
