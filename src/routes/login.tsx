import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, OAuthRow } from "@/components/auth/authShell";
import { useSignIn } from "@/components/auth/hooks/use-sign-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInSchema } from "@/lib/schemas/auth";

export const Route = createFileRoute("/login")({
	validateSearch: (s: Record<string, unknown>) => ({
		redirect: typeof s.redirect === "string" ? s.redirect : undefined,
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
			title="Welcome back"
			subtitle="Sign in to manage your DevLinks page."
		>
			<OAuthRow />
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="space-y-4"
				noValidate
			>
				<form.Field
					name="email"
					validators={{
						onChange: ({ value }) => {
							const result = signInSchema.shape.email.safeParse(value);
							return result.success
								? undefined
								: result.error.issues[0]?.message;
						},
					}}
					children={(field) => (
						<div className="space-y-1.5">
							<Label htmlFor={field.name}>Email</Label>
							<Input
								id={field.name}
								name={field.name}
								type="email"
								autoComplete="email"
								placeholder="you@dev.io"
								value={field.state.value}
								onBlur={field.handleBlur}
								onChange={(e) => field.handleChange(e.target.value)}
							/>
							{field.state.meta.isTouched &&
							field.state.meta.errors.length > 0 ? (
								<p className="text-xs text-destructive">
									{field.state.meta.errors.join(", ")}
								</p>
							) : null}
						</div>
					)}
				/>

				<form.Field
					name="password"
					validators={{
						onChange: ({ value }) => {
							const result = signInSchema.shape.password.safeParse(value);
							return result.success
								? undefined
								: result.error.issues[0]?.message;
						},
					}}
					children={(field) => (
						<div className="space-y-1.5">
							<div className="flex items-center justify-between">
								<Label htmlFor={field.name}>Password</Label>
								<Link
									to="/forgot-password"
									className="text-xs text-muted-foreground hover:text-foreground"
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
							/>
							{field.state.meta.isTouched &&
							field.state.meta.errors.length > 0 ? (
								<p className="text-xs text-destructive">
									{field.state.meta.errors.join(", ")}
								</p>
							) : null}
						</div>
					)}
				/>

				{signIn.error ? (
					<p className="text-sm text-destructive">{signIn.error.message}</p>
				) : null}

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
					children={({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || signIn.isPending || isSubmitting}
						>
							{signIn.isPending || isSubmitting ? "Signing in…" : "Sign in"}
						</Button>
					)}
				/>
			</form>
			<p className="mt-5 text-center text-sm text-muted-foreground">
				New to DevLinks?{" "}
				<Link
					to="/signup"
					className="font-medium text-foreground hover:underline"
				>
					Create an account
				</Link>
			</p>
		</AuthShell>
	);
}
