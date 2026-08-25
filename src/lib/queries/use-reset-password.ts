import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function useResetPassword() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: { newPassword: string; token: string }) => {
			const { error } = await authClient.resetPassword({
				newPassword: input.newPassword,
				token: input.token,
			});
			if (error) throw new Error(error.message ?? "Could not reset password.");
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["session"] });
		},
	});
}
