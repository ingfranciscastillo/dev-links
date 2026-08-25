import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import type { SignUpInput } from "@/lib/schemas/auth";

export function useSignUp(opts?: { redirectTo?: string }) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: SignUpInput) => {
			const { error } = await authClient.signUp.email({
				email: input.email,
				password: input.password,
				name: input.name,
				username: input.username.toLowerCase(),
				callbackURL: opts?.redirectTo ?? "/dashboard",
			});
			if (error) throw new Error(error.message ?? "Could not sign up.");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session"] });
		},
	});
}
