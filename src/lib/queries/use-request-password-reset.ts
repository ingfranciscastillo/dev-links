import { useMutation } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function useRequestPasswordReset(opts?: { redirectTo?: string }) {
	return useMutation({
		mutationFn: async (input: { email: string }) => {
			const { error } = await authClient.requestPasswordReset({
				email: input.email,
				redirectTo: opts?.redirectTo ?? "/reset-password",
			});
			if (error) throw new Error(error.message ?? "Could not send reset link.");
		},
	});
}
