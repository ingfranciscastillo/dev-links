import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthShell } from "@/components/auth/authShell";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useResetPassword } from "@/lib/queries/use-reset-password";
import { passwordSchema, resetPasswordSchema } from "@/lib/schemas/auth";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/reset-password")({
	validateSearch: (s: Record<string, unknown>) => ({
		token: typeof s.token === "string" ? s.token : undefined,
	}),
	head: () => ({ meta: [{ title: "Set new password — DevLinks" }] }),
	component: ResetPage,
});

function ResetPage() {
	const { token } = Route.useSearch();
	const reset = useResetPassword();

	const form = useForm({
		defaultValues: { password: "", confirm: "" },
		onSubmit: async ({ value }) => {
			await reset.mutateAsync({
				newPassword: value.password,
				token: token ?? "",
			});
		},
	});

	if (!token) {
		return (
			<AuthShell
				title="Missing reset token"
				subtitle="This link is incomplete or malformed."
			>
				<div className="space-y-4 text-center">
					<p className="text-sm text-muted-foreground">
						Request a fresh link and open it from your email.
					</p>
					<Button asChild className="w-full">
						<Link to="/forgot-password">Request new link</Link>
					</Button>
				</div>
			</AuthShell>
		);
	}

	if (reset.isSuccess) {
		return (
			<AuthShell title="Password updated" subtitle="Redirecting to sign in…">
				<RedirectToLogin />
			</AuthShell>
		);
	}

	return (
		<AuthShell
			title="Set new password"
			subtitle="Pick something stronger than 'password123'."
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
						name="password"
						validators={{ onChange: zodField(passwordSchema) }}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<FieldLabel htmlFor={field.name}>New password</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="new-password"
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

					<form.Field
						name="confirm"
						validators={{
							onChange: ({ value, fieldApi }) => {
								const password = fieldApi.form.getFieldValue("password");
								const r = resetPasswordSchema.safeParse({
									password,
									confirm: value,
								});
								if (r.success) return undefined;
								const confirmIssue = r.error.issues.find(
									(i) => i.path[0] === "confirm",
								);
								return confirmIssue?.message ?? r.error.issues[0]?.message;
							},
						}}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<FieldLabel htmlFor={field.name}>Confirm password</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="new-password"
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

					{reset.error ? <FieldError>{reset.error.message}</FieldError> : null}

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
									disabled={!canSubmit || reset.isPending || isSubmitting}
								>
									{reset.isPending || isSubmitting
										? "Updating…"
										: "Update password"}
								</Button>
							</Field>
						)}
					</form.Subscribe>
				</FieldGroup>
			</form>
		</AuthShell>
	);
}

function RedirectToLogin() {
	const navigate = useNavigate();
	useEffect(() => {
		const t = setTimeout(
			() => navigate({ to: "/login", search: { redirect: undefined } }),
			1200,
		);
		return () => clearTimeout(t);
	}, [navigate]);

	return (
		<Link
			to="/login"
			search={{ redirect: undefined }}
			className="block text-center text-sm text-muted-foreground hover:text-foreground"
		>
			Go to sign in
		</Link>
	);
}
