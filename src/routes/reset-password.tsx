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
		defaultValues: {
			password: "",
			confirm: "",
		},
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
				title="Missing reset token."
				subtitle="This link is incomplete or malformed."
			>
				<div className="border-t border-border pt-6">
					<p className="text-sm leading-relaxed text-muted-foreground">
						Request a fresh link and open it from your email.
					</p>

					<Link
						to="/forgot-password"
						className="group mt-6 inline-flex w-full items-center justify-center border border-foreground px-4 py-3 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
					>
						Request new link
					</Link>
				</div>
			</AuthShell>
		);
	}

	if (reset.isSuccess) {
		return (
			<AuthShell
				title="Password updated."
				subtitle="Your password has been changed successfully."
			>
				<RedirectToLogin />
			</AuthShell>
		);
	}

	return (
		<AuthShell
			title="Set new password."
			subtitle="Choose a new password for your DevLinks account."
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
						name="password"
						validators={{
							onChange: zodField(passwordSchema),
						}}
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
										New password
									</FieldLabel>

									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="new-password"
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
						name="confirm"
						validators={{
							onChange: ({ value, fieldApi }) => {
								const password = fieldApi.form.getFieldValue("password");

								const result = resetPasswordSchema.safeParse({
									password,
									confirm: value,
								});

								if (result.success) return undefined;

								const confirmIssue = result.error.issues.find(
									(issue) => issue.path[0] === "confirm",
								);

								return confirmIssue?.message ?? result.error.issues[0]?.message;
							},
						}}
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
										Confirm password
									</FieldLabel>

									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="new-password"
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
									disabled={!canSubmit || reset.isPending || isSubmitting}
									className="mt-2 h-11 w-full rounded-none bg-foreground font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
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
		const timer = setTimeout(
			() => navigate({ to: "/login", search: { redirect: undefined } }),
			1200,
		);

		return () => clearTimeout(timer);
	}, [navigate]);

	return (
		<div className="border-t border-border pt-6">
			<p className="text-sm leading-relaxed text-muted-foreground">
				Redirecting you to sign in…
			</p>

			<Link
				to="/login"
				search={{ redirect: undefined }}
				className="mt-5 inline-block font-mono text-[10px] uppercase tracking-[0.08em] text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-brand"
			>
				Go to sign in
			</Link>
		</div>
	);
}
