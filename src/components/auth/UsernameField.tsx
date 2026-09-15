import { useEffect, useRef, useState } from "react";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { profileInput } from "@/lib/api/profile-data.functions";
import { authClient } from "@/lib/auth-client";

export type UsernameStatus = "idle" | "checking" | "available" | "taken";

export const USERNAME_STATUS_COPY: Record<UsernameStatus, string | null> = {
	idle: null,
	checking: "Checking…",
	available: "Available",
	taken: "Already taken",
};

// Mismo patrón de debounce que el claim de username en el CTA de landing
// (src/components/landing/cta.tsx) — currentUsername se salta el chequeo
// cuando el valor es el username actual del usuario (isUsernameAvailable lo
// reportaría como "tomado" por él mismo). En onboarding no hay uno todavía,
// así que se le pasa "".
export function UsernameField({
	id,
	name,
	value,
	currentUsername,
	invalid,
	errors,
	onChange,
	onBlur,
	onStatusChange,
}: {
	id: string;
	name: string;
	value: string;
	currentUsername: string;
	invalid: boolean;
	errors: unknown[];
	onChange: (value: string) => void;
	onBlur: () => void;
	onStatusChange: (status: UsernameStatus) => void;
}) {
	const [status, setStatus] = useState<UsernameStatus>("idle");
	const requestId = useRef(0);

	useEffect(() => {
		const trimmed = value.trim().toLowerCase();

		function update(next: UsernameStatus) {
			setStatus(next);
			onStatusChange(next);
		}

		if (!trimmed || trimmed === currentUsername.toLowerCase()) {
			update("idle");
			return;
		}
		if (!profileInput.shape.username.safeParse(trimmed).success) {
			update("idle");
			return;
		}

		update("checking");
		const id = ++requestId.current;

		const timer = setTimeout(async () => {
			try {
				const { data } = await authClient.isUsernameAvailable({
					username: trimmed,
				});
				if (requestId.current !== id) return;
				update(data?.available ? "available" : "taken");
			} catch {
				if (requestId.current !== id) return;
				update("idle");
			}
		}, 400);

		return () => clearTimeout(timer);
	}, [value, currentUsername, onStatusChange]);

	return (
		<Field data-invalid={invalid}>
			<FieldLabel
				htmlFor={id}
				className="font-mono text-[10px] uppercase tracking-[0.08em]"
			>
				Username
			</FieldLabel>

			<div className="mt-2 flex h-11 items-center border-b border-border transition-colors focus-within:border-brand">
				<span className="shrink-0 font-mono text-[11px] text-muted-foreground">
					devlinks.com/
				</span>

				<Input
					id={id}
					name={name}
					value={value}
					onBlur={onBlur}
					onChange={(e) => onChange(e.target.value.toLowerCase())}
					aria-invalid={invalid || undefined}
					className="h-full rounded-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
				/>
			</div>

			{invalid ? (
				<FieldError>{errors.join(", ")}</FieldError>
			) : USERNAME_STATUS_COPY[status] ? (
				<p
					className={`mt-2 font-mono text-[9px] uppercase tracking-[0.08em] ${
						status === "taken"
							? "text-destructive"
							: status === "available"
								? "text-brand"
								: "text-muted-foreground"
					}`}
				>
					{USERNAME_STATUS_COPY[status]}
				</p>
			) : null}
		</Field>
	);
}
