import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { authClient } from "@/lib/auth-client";
import type { SignInInput } from "@/lib/schemas/auth";
import { safeRedirectPath } from "@/lib/utils";

export function useSignIn(opts?: { redirectTo?: string }) {
	const navigate = useNavigate();

	return useMutation({
		mutationFn: async (input: SignInInput) => {
			// Sin callbackURL: el redirectPlugin de better-auth hace
			// window.location.href en cuanto lo recibe, compitiendo con el
			// navigate() de abajo — doble navegación, doble montaje de la
			// página de destino (se veía como el título re-animando dos veces).
			const { error } = await authClient.signIn.email({
				email: input.email,
				password: input.password,
			});
			if (error) throw new Error(error.message ?? "Invalid credentials");
			return { ok: true as const };
		},
		onSuccess: () => {
			navigate({ to: safeRedirectPath(opts?.redirectTo) ?? "/dashboard" });
		},
	});
}
