import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { usernameSchema } from "@/lib/schemas/auth";

export type UsernameAvailability =
	| "idle"
	| "invalid"
	| "checking"
	| "available"
	| "taken";

const DEBOUNCE_MS = 400;

// Compartido entre el CTA del landing, el signup y el modal de claim del
// watermark — mismo debounce, mismo endpoint, mismo set de estados, para que
// el feedback de disponibilidad se sienta igual en cualquier punto de entrada.
export function useUsernameAvailability(
	value: string,
	currentUsername?: string,
): UsernameAvailability {
	const [status, setStatus] = useState<UsernameAvailability>("idle");
	const requestId = useRef(0);

	useEffect(() => {
		const trimmed = value.trim().toLowerCase();

		if (!trimmed || trimmed === currentUsername?.toLowerCase()) {
			setStatus("idle");
			return;
		}
		if (!usernameSchema.safeParse(trimmed).success) {
			setStatus("invalid");
			return;
		}

		setStatus("checking");
		const id = ++requestId.current;

		const timer = setTimeout(async () => {
			try {
				const { data } = await authClient.isUsernameAvailable({
					username: trimmed,
				});
				if (requestId.current !== id) return;
				setStatus(data?.available ? "available" : "taken");
			} catch {
				if (requestId.current !== id) return;
				setStatus("idle");
			}
		}, DEBOUNCE_MS);

		return () => clearTimeout(timer);
	}, [value, currentUsername]);

	return status;
}
