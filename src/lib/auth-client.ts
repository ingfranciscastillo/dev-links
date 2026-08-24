import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "./auth";

export const authClient = createAuthClient({
	baseURL:
		import.meta.env.VITE_BETTER_AUTH_URL ??
		process.env.BETTER_AUTH_URL ??
		"http://localhost:3000",
	plugins: [usernameClient()],
});

export type Session = Auth["$Infer"]["Session"];
export type User = Auth["$Infer"]["Session"]["user"];
