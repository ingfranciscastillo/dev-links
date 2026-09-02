import { useForm } from "@tanstack/react-form";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, sendContactMessage } from "@/lib/api/contact.functions";
import { zodField } from "@/lib/schemas/field";

export const Route = createFileRoute("/contact")({
	head: () => ({
		meta: [
			{ title: "Contact — DevLinks" },
			{
				name: "description",
				content:
					"Get in touch with the DevLinks team — questions, bugs, or feedback.",
			},
		],
	}),
	component: ContactPage,
});

function ContactPage() {
	const [sent, setSent] = useState(false);

	const send = useMutation({
		mutationFn: (input: {
			name: string;
			email: string;
			message: string;
			website: string;
		}) => sendContactMessage({ data: input }),
		onSuccess: () => setSent(true),
	});

	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
			message: "",
			website: "",
		},
		onSubmit: async ({ value }) => {
			await send.mutateAsync(value);
		},
	});

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Contact
				</p>

				<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-7xl">
					Get in touch.
				</h1>

				<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
					Questions, bugs, feedback, or anything else — send it over and we'll
					get back to you.
				</p>

				{sent ? (
					<div className="mt-12 max-w-lg border-t border-border pt-8">
						<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
							Sent
						</p>
						<h2 className="mt-3 font-display text-2xl tracking-[-0.02em]">
							Thanks — we'll be in touch.
						</h2>
						<p className="mt-2 text-sm leading-relaxed text-muted-foreground">
							We read every message and usually reply within a couple of
							business days.
						</p>
					</div>
				) : (
					<form
						onSubmit={(event) => {
							event.preventDefault();
							event.stopPropagation();
							form.handleSubmit();
						}}
						className="mt-12 max-w-lg border-t border-border pt-8"
						noValidate
					>
						<FieldGroup className="gap-6">
							<form.Field
								name="name"
								validators={{
									onChange: zodField(contactSchema.shape.name),
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
												Name
											</FieldLabel>

											<Input
												id={field.name}
												name={field.name}
												autoComplete="name"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
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
								name="email"
								validators={{
									onChange: zodField(contactSchema.shape.email),
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
												Email
											</FieldLabel>

											<Input
												id={field.name}
												name={field.name}
												type="email"
												autoComplete="email"
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
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
								name="message"
								validators={{
									onChange: zodField(contactSchema.shape.message),
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
												Message
											</FieldLabel>

											<Textarea
												id={field.name}
												name={field.name}
												rows={6}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(event) =>
													field.handleChange(event.target.value)
												}
												aria-invalid={invalid || undefined}
												className="mt-2 resize-none rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
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

							{/* Honeypot — oculto para humanos, los bots que autocompletan
							    todo lo llenan. */}
							<form.Field name="website">
								{(field) => (
									<input
										type="text"
										name={field.name}
										value={field.state.value}
										onChange={(event) => field.handleChange(event.target.value)}
										tabIndex={-1}
										autoComplete="off"
										aria-hidden="true"
										className="hidden"
									/>
								)}
							</form.Field>
						</FieldGroup>

						{send.isError && (
							<p className="mt-4 text-sm text-destructive">
								Couldn't send your message. Please try again.
							</p>
						)}

						<form.Subscribe
							selector={(state) => ({
								canSubmit: state.canSubmit,
								isSubmitting: state.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Button
									type="submit"
									disabled={!canSubmit || send.isPending || isSubmitting}
									className="mt-8 h-11 rounded-none bg-foreground px-6 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
								>
									{send.isPending || isSubmitting ? "Sending…" : "Send message"}
								</Button>
							)}
						</form.Subscribe>
					</form>
				)}
			</main>

			<Footer />
		</div>
	);
}
