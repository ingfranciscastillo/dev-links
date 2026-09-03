import { dodopaymentsClient } from "@dodopayments/better-auth/client";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "./auth";

export const authClient = createAuthClient({
	// Sin baseURL, better-auth resuelve a "/api/auth" (mismo origen). El
	// fallback anterior a localhost:3000 quedaba hardcodeado en el bundle de
	// cliente y el navegador terminaba pegándole a localhost en producción.
	baseURL: import.meta.env.VITE_BETTER_AUTH_URL,
	plugins: [usernameClient(), dodopaymentsClient()],
});

export type Session = Auth["$Infer"]["Session"];
export type User = Auth["$Infer"]["Session"]["user"];
