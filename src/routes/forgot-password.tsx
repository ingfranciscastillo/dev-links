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
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			await requestReset.mutateAsync(value);
		},
	});

	if (requestReset.isSuccess) {
		return (
			<AuthShell
				title="Check your inbox."
				subtitle="If that email exists, we sent a reset link."
			>
				<div className="border-t border-border pt-6">
					<p className="text-sm leading-relaxed text-muted-foreground">
						Open the link in your email to choose a new password.
					</p>

					<Link
						to="/login"
						search={{ redirect: undefined }}
						className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.08em] text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-brand"
					>
						Back to sign in
					</Link>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell
			title="Forgot your password?"
			subtitle="Enter your email and we'll send you a reset link."
			footer={
				<Link
					to="/login"
					search={{ redirect: undefined }}
					className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
				>
					Sign in
				</Link>
			}
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
						name="email"
						validators={{ onChange: zodField(emailSchema) }}
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
										Email
									</FieldLabel>

									<Input
										id={field.name}
										name={field.name}
										type="email"
										autoComplete="email"
										placeholder="you@example.com"
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
									disabled={
										!canSubmit || requestReset.isPending || isSubmitting
									}
									className="mt-2 h-11 w-full rounded-none bg-foreground font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
								>
									{requestReset.isPending || isSubmitting
										? "Sending…"
										: "Send reset link"}
								</Button>
							</Field>
						)}
					</form.Subscribe>
				</FieldGroup>
			</form>

			<p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
				Remember your password?{" "}
				<Link
					to="/login"
					search={{ redirect: undefined }}
					className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-brand hover:text-brand"
				>
					Back to sign in
				</Link>
			</p>
		</AuthShell>
	);
}
