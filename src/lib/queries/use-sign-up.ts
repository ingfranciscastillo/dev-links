import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import type { SignUpInput } from "@/lib/schemas/auth";
import { safeRedirectPath } from "@/lib/utils";

export function useSignUp(opts?: { redirectTo?: string }) {
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (input: SignUpInput) => {
			// Sin callbackURL — mismo motivo que useSignIn: evita el
			// window.location.href de better-auth peleando con el navigate()
			// de onSuccess.
			const { error } = await authClient.signUp.email({
				email: input.email,
				password: input.password,
				name: input.name,
				username: input.username.toLowerCase(),
			});
			if (error) throw new Error(error.message ?? "Could not sign up.");
		},
		onSuccess: () => {
			navigate({ to: safeRedirectPath(opts?.redirectTo) ?? "/dashboard" });
		},
	});
}
