import { dodopaymentsClient } from "@dodopayments/better-auth/client";
import { usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { Auth } from "./auth";

export const authClient = createAuthClient({
	baseURL: import.meta.env.BETTER_AUTH_URL,
	plugins: [usernameClient(), dodopaymentsClient()],
});

export type Session = Auth["$Infer"]["Session"];
export type User = Auth["$Infer"]["Session"]["user"];
