import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	redirect,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import posthog from "posthog-js";
import { useState } from "react";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/auth/authShell";
import {
	UsernameField,
	type UsernameStatus,
} from "@/components/auth/UsernameField";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { autoConnectGithub } from "@/lib/api/integrations/account.functions";
import { profileInput } from "@/lib/api/profile-data.functions";
import { useUpdateProfile } from "@/lib/queries/profile-data";
import { zodField } from "@/lib/schemas/field";
import { slugifyUsername } from "@/lib/user";

export const Route = createFileRoute("/_authenticated/onboarding")({
	beforeLoad: ({ context }) => {
		// Ya tiene username (llegó acá con el link directo, back button, etc.) —
		// no hay nada que hacer, mándalo al dashboard.
		if (context.user.username) {
			throw redirect({ to: "/dashboard" });
		}
	},
	head: () => ({ meta: [{ title: "Claim your username — DevLinks" }] }),
	component: OnboardingPage,
});

function OnboardingPage() {
	const { user } = useRouteContext({ from: "/_authenticated/onboarding" });
	const router = useRouter();
	const updateProfile = useUpdateProfile();
	const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

	const form = useForm({
		defaultValues: {
			name: user.name ?? "",
			username: slugifyUsername(user.name ?? user.email ?? "dev"),
		},
		onSubmit: async ({ value }) => {
			try {
				await updateProfile.mutateAsync({
					name: value.name,
					username: value.username.toLowerCase(),
				});
				// Only reached by first-time OAuth signups (see beforeLoad) —
				// email signups fire this in use-sign-up.ts instead.
				posthog.capture("signup_completed", { method: "oauth" });

				// Si el signup fue con GitHub, conecta la integración de una vez
				// con el access token que better-auth ya guardó — sin esto el
				// usuario tendría que volver a escribir su propio username en
				// /dashboard/integrations. No-op silencioso si no fue GitHub o
				// si la llamada a la API de GitHub falla.
				try {
					const result = await autoConnectGithub();
					if (result.connected) {
						posthog.capture("github_auto_connected");
						toast.success("GitHub connected");
					}
				} catch {
					// Ignorado a propósito — nunca debe bloquear el onboarding.
				}

				await router.invalidate();
				await router.navigate({ to: "/dashboard" });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Couldn't claim that username",
				);
			}
		},
	});

	return (
		<AuthShell
			title="Claim your address."
			subtitle="This is the URL people will use to find you — devlinks.com/your-username. You can change it later."
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				noValidate
			>
				<FieldGroup className="gap-5">
					<form.Field
						name="name"
						validators={{ onChange: zodField(profileInput.shape.name) }}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;

							return (
								<Field data-invalid={invalid}>
									<FieldLabel
										htmlFor={field.name}
										className="font-mono text-[10px] uppercase tracking-[0.08em]"
									>
										Name
									</FieldLabel>

									<Input
										id={field.name}
										name={field.name}
										autoComplete="name"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={invalid || undefined}
										className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
									/>

									{invalid ? (
										<FieldError>
											{field.state.meta.errors.join(", ")}
										</FieldError>
									) : null}
								</Field>
							);
						}}
					</form.Field>

					<form.Field
						name="username"
						validators={{ onChange: zodField(profileInput.shape.username) }}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;

							return (
								<UsernameField
									id={field.name}
									name={field.name}
									value={field.state.value}
									currentUsername=""
									invalid={invalid}
									errors={field.state.meta.errors}
									onChange={field.handleChange}
									onBlur={field.handleBlur}
									onStatusChange={setUsernameStatus}
								/>
							);
						}}
					</form.Field>

					<form.Subscribe
						selector={(state) => ({
							canSubmit: state.canSubmit,
							isSubmitting: state.isSubmitting,
						})}
					>
						{({ canSubmit, isSubmitting }) => (
							<Field>
								<Button
									type="submit"
									disabled={
										!canSubmit ||
										usernameStatus === "taken" ||
										usernameStatus === "checking" ||
										updateProfile.isPending ||
										isSubmitting
									}
									className="mt-2 h-11 w-full rounded-none bg-foreground font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
								>
									{updateProfile.isPending || isSubmitting
										? "Saving…"
										: "Continue"}
								</Button>
							</Field>
						)}
					</form.Subscribe>
				</FieldGroup>
			</form>
		</AuthShell>
	);
}
