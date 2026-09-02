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
	validateSearch: (s: Record<string, unknown>) => ({
		username:
			typeof s.username === "string" ? s.username.slice(0, 24) : undefined,
	}),
	head: () => ({ meta: [{ title: "Create your DevLinks" }] }),
	component: SignupPage,
});

function SignupPage() {
	const navigate = useNavigate();
	const { username } = Route.useSearch();
	const signUp = useSignUp({ redirectTo: "/dashboard" });

	const form = useForm({
		defaultValues: {
			name: "",
			username: username?.toLowerCase() ?? "",
			email: "",
			password: "",
		},
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
			title="Create your DevLinks."
			subtitle="Your one page for everything you ship."
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
			<OAuthRow callbackURL="/dashboard" />

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				noValidate
				className="mt-8"
			>
				<FieldGroup className="gap-5">
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
										placeholder="Ada Lovelace"
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
						validators={{ onChange: zodField(usernameSchema) }}
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
										Username
									</FieldLabel>

									<InputGroup className="mt-2 rounded-none border-x-0 border-t-0 border-b-border bg-transparent shadow-none focus-within:border-brand focus-within:ring-0">
										<InputGroupAddon className="pl-0">
											<span className="font-mono text-[11px] text-muted-foreground">
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
											className="h-11 rounded-none bg-transparent px-1 shadow-none focus-visible:ring-0"
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
						validators={{ onChange: zodField(passwordSchema) }}
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
										Password
									</FieldLabel>

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
									disabled={!canSubmit || signUp.isPending || isSubmitting}
									className="mt-2 h-11 w-full rounded-none bg-foreground font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
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

			<p className="mt-8 border-t border-border pt-6 text-center text-sm text-muted-foreground">
				Already have an account?{" "}
				<Link
					to="/login"
					search={{ redirect: undefined }}
					className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-brand hover:text-brand"
				>
					Sign in
				</Link>
			</p>
		</AuthShell>
	);
}
