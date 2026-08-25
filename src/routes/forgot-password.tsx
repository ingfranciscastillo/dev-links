import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell } from "@/components/auth/authShell";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useRequestPasswordReset } from "@/lib/queries/use-request-password-reset";
import { emailSchema } from "@/lib/schemas/auth";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/forgot-password")({
	head: () => ({ meta: [{ title: "Reset password — DevLinks" }] }),
	component: ForgotPage,
});

function ForgotPage() {
	const requestReset = useRequestPasswordReset({
		redirectTo:
			typeof window !== "undefined"
				? `${window.location.origin}/reset-password`
				: "/reset-password",
	});

	const form = useForm({
		defaultValues: { email: "" },
		onSubmit: async ({ value }) => {
			await requestReset.mutateAsync(value);
		},
	});

	if (requestReset.isSuccess) {
		return (
			<AuthShell
				title="Check your inbox"
				subtitle="If that email exists, we sent a reset link."
			>
				<Link
					to="/login"
					search={{ redirect: undefined }}
					className="block text-center text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to sign in
				</Link>
			</AuthShell>
		);
	}

	return (
		<AuthShell
			title="Forgot password?"
			subtitle="Enter your email and we'll send a reset link."
		>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				noValidate
			>
				<FieldGroup>
					<form.Field
						name="email"
						validators={{ onChange: zodField(emailSchema) }}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<FieldLabel htmlFor={field.name}>Email</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="email"
										autoComplete="email"
										placeholder="you@dev.io"
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										aria-invalid={invalid || undefined}
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

					{requestReset.error ? (
						<FieldError>{requestReset.error.message}</FieldError>
					) : null}

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
									className="w-full"
									disabled={
										!canSubmit || requestReset.isPending || isSubmitting
									}
								>
									{requestReset.isPending || isSubmitting
										? "Sending…"
										: "Send reset link"}
								</Button>
							</Field>
						)}
					</form.Subscribe>
				</FieldGroup>
				<Link
					to="/login"
					search={{ redirect: undefined }}
					className="mt-4 block text-center text-sm text-muted-foreground hover:text-foreground"
				>
					← Back to sign in
				</Link>
			</form>
		</AuthShell>
	);
}
