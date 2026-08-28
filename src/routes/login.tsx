import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, OAuthRow } from "@/components/auth/authShell";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useSignIn } from "@/lib/queries/use-sign-in";
import { signInSchema } from "@/lib/schemas/auth";
import { zodField } from "@/lib/schemas/field";
import { safeRedirectPath } from "@/lib/utils";

export const Route = createFileRoute("/login")({
	validateSearch: (s: Record<string, unknown>) => ({
		redirect:
			safeRedirectPath(
				typeof s.redirect === "string" ? s.redirect : undefined,
			) ?? undefined,
	}),
	head: () => ({ meta: [{ title: "Sign in — DevLinks" }] }),
	component: LoginPage,
});

function LoginPage() {
	const { redirect } = Route.useSearch();
	const signIn = useSignIn({ redirectTo: redirect });
	const form = useForm({
		defaultValues: { email: "", password: "" },
		onSubmit: async ({ value }) => {
			await signIn.mutateAsync(value);
		},
	});
	return (
		<AuthShell
			title="Welcome back."
			subtitle="Sign in to manage your DevLinks profile."
			footer={
				<Link
					to="/signup"
					className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
				>
					Create account
				</Link>
			}
		>
			<OAuthRow callbackURL={redirect ?? "/dashboard"} />
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				noValidate
				className="mt-8"
			>
				<FieldGroup>
					<form.Field
						name="email"
						validators={{ onChange: zodField(signInSchema.shape.email) }}
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
					<form.Field
						name="password"
						validators={{ onChange: zodField(signInSchema.shape.password) }}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<div className="flex items-center justify-between">
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Password
										</FieldLabel>
										<Link
											to="/forgot-password"
											className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
										>
											Forgot?
										</Link>
									</div>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="current-password"
										placeholder="••••••••"
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
					{signIn.error ? (
						<FieldError>{signIn.error.message}</FieldError>
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
									disabled={!canSubmit || signIn.isPending || isSubmitting}
									className="mt-2 h-11 w-full rounded-none bg-foreground font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
								>
									{signIn.isPending || isSubmitting ? "Signing in…" : "Sign in"}
								</Button>
							</Field>
						)}
					</form.Subscribe>
				</FieldGroup>
			</form>
			<p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
				New to DevLinks?{" "}
				<Link
					to="/signup"
					className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-brand hover:text-brand"
				>
					Create an account
				</Link>
			</p>
		</AuthShell>
	);
}
