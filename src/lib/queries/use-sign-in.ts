import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import type { SignInInput } from "@/lib/schemas/auth";
import { safeRedirectPath } from "@/lib/utils";

export function useSignIn(opts?: { redirectTo?: string }) {
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (input: SignInInput) => {
			const { error } = await authClient.signIn.email({
				email: input.email,
				password: input.password,
				callbackURL: safeRedirectPath(opts?.redirectTo) ?? "/dashboard",
			});
			if (error) throw new Error(error.message ?? "Invalid credentials");
			return { ok: true as const };
		},
		onSuccess: () => {
			navigate({ to: safeRedirectPath(opts?.redirectTo) ?? "/dashboard" });
		},
	});
}
