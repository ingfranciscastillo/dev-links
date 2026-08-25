import { useForm } from "@tanstack/react-form";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthShell, OAuthRow } from "@/components/auth/authShell";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { useSignUp } from "@/lib/queries/use-sign-up";
import {
	emailSchema,
	nameSchema,
	passwordSchema,
	usernameSchema,
} from "@/lib/schemas/auth";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/signup")({
	head: () => ({ meta: [{ title: "Create your DevLinks" }] }),
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	const signUp = useSignUp({ redirectTo: "/dashboard" });

	const form = useForm({
		defaultValues: { name: "", username: "", email: "", password: "" },
		onSubmit: async ({ value }) => {
			await signUp.mutateAsync({
				...value,
				username: value.username.toLowerCase(),
			});
			await navigate({ to: "/dashboard" });
		},
	});

	return (
		<AuthShell
			title="Create your DevLinks"
			subtitle="Your one page for everything you ship."
		>
			<OAuthRow callbackURL="/dashboard" />
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				noValidate
			>
				<FieldGroup className="gap-4">
					<form.Field
						name="name"
						validators={{ onChange: zodField(nameSchema) }}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<FieldLabel htmlFor={field.name}>Name</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										autoComplete="name"
										placeholder="Ada Lovelace"
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
						name="username"
						validators={{ onChange: zodField(usernameSchema) }}
					>
						{(field) => {
							const invalid =
								field.state.meta.isTouched &&
								field.state.meta.errors.length > 0;
							return (
								<Field data-invalid={invalid}>
									<FieldLabel htmlFor={field.name}>Username</FieldLabel>
									<InputGroup>
										<InputGroupAddon>
											<span className="font-mono text-xs text-muted-foreground">
												devlinks.com/
											</span>
										</InputGroupAddon>
										<InputGroupInput
											id={field.name}
											name={field.name}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(e) =>
												field.handleChange(e.target.value.toLowerCase())
											}
											placeholder="ada"
											aria-invalid={invalid || undefined}
										/>
									</InputGroup>
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
									<FieldLabel htmlFor={field.name}>Password</FieldLabel>
									<Input
										id={field.name}
										name={field.name}
										type="password"
										autoComplete="new-password"
										placeholder="At least 6 characters"
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

					{signUp.error ? (
						<FieldError>{signUp.error.message}</FieldError>
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
									disabled={!canSubmit || signUp.isPending || isSubmitting}
								>
									{signUp.isPending || isSubmitting
										? "Creating…"
										: "Create account"}
								</Button>
							</Field>
						)}
					</form.Subscribe>
				</FieldGroup>
			</form>
			<p className="mt-5 text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				<Link
					to="/login"
					search={{ redirect: undefined }}
					className="font-medium text-foreground hover:underline"
				>
					Sign in
				</Link>
			</p>
		</AuthShell>
	);
}
