import { useForm } from "@tanstack/react-form";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { Camera } from "lucide-react";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { profileInput } from "@/lib/api/profile-data.functions";
import { useProfileCore, useUpdateProfile } from "@/lib/queries/profile-data";
import { zodField } from "@/lib/schemas/field";
import { hueFromString } from "@/lib/user";

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
	head: () => ({ meta: [{ title: "Profile — DevLinks" }] }),
	component: ProfilePage,
});

function ProfilePage() {
	const { user } = useRouteContext({ from: "/_authenticated/dashboard" });
	const core = useProfileCore();
	const updateProfile = useUpdateProfile();

	const form = useForm({
		defaultValues: {
			name: user.name,
			username: user.username ?? "",
			bio: "",
			location: "",
			website: "",
		},
		onSubmit: async ({ value }) => {
			try {
				await updateProfile.mutateAsync(value);
				toast.success("Profile updated");
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Save failed");
			}
		},
	});

	useEffect(() => {
		if (!core.data) return;

		form.reset({
			name: user.name,
			username: user.username ?? "",
			bio: core.data.bio,
			location: core.data.location,
			website: core.data.website,
		});
	}, [core.data, form, user.name, user.username]);

	const avatarHue = hueFromString(user.id);

	return (
		<>
			<div className="mb-6">
				<p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
					Settings
				</p>
				<h1 className="mt-1 text-3xl font-semibold tracking-tight">Profile</h1>
				<p className="mt-1 text-sm text-muted-foreground">
					How visitors will see you on your public page.
				</p>
			</div>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				className="max-w-2xl flex flex-col gap-6"
				noValidate
			>
				<div className="rounded-xl border border-hairline bg-surface/40 p-6">
					<div className="flex items-center gap-4">
						<div
							className="relative flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-background"
							style={{ background: `oklch(0.7 0.18 ${avatarHue})` }}
						>
							{user.name.slice(0, 1).toUpperCase()}
							<button
								type="button"
								title="Coming soon"
								className="absolute -bottom-1 -right-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground"
							>
								<Camera className="h-3 w-3" />
							</button>
						</div>
						<div>
							<p className="text-sm font-medium">Avatar</p>
							<p className="text-xs text-muted-foreground">
								PNG or JPG, max 2MB. Upload coming soon.
							</p>
						</div>
					</div>
				</div>

				<div className="rounded-xl border border-hairline bg-surface/40 p-6">
					<FieldGroup>
						<div className="grid gap-5 sm:grid-cols-2">
							<form.Field
								name="name"
								validators={{
									onChange: zodField(profileInput.shape.name),
								}}
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
								validators={{
									onChange: zodField(profileInput.shape.username),
								}}
							>
								{(field) => {
									const invalid =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<Field data-invalid={invalid}>
											<FieldLabel htmlFor={field.name}>Username</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(e.target.value.toLowerCase())
												}
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
						</div>

						<form.Field
							name="bio"
							validators={{ onChange: zodField(profileInput.shape.bio) }}
						>
							{(field) => {
								const invalid =
									field.state.meta.isTouched &&
									field.state.meta.errors.length > 0;
								return (
									<Field data-invalid={invalid}>
										<FieldLabel htmlFor={field.name}>Bio</FieldLabel>
										<textarea
											id={field.name}
											name={field.name}
											rows={3}
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Full-stack engineer building developer tools…"
											aria-invalid={invalid || undefined}
											className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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

						<div className="grid gap-5 sm:grid-cols-2">
							<form.Field name="location">
								{(field) => (
									<Field>
										<FieldLabel htmlFor={field.name}>Location</FieldLabel>
										<Input
											id={field.name}
											name={field.name}
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="Madrid, Spain"
										/>
									</Field>
								)}
							</form.Field>

							<form.Field
								name="website"
								validators={{
									onChange: zodField(profileInput.shape.website),
								}}
							>
								{(field) => {
									const invalid =
										field.state.meta.isTouched &&
										field.state.meta.errors.length > 0;
									return (
										<Field data-invalid={invalid}>
											<FieldLabel htmlFor={field.name}>Website</FieldLabel>
											<Input
												id={field.name}
												name={field.name}
												type="url"
												value={field.state.value ?? ""}
												onBlur={field.handleBlur}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder="https://your.dev"
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
						</div>
					</FieldGroup>
				</div>

				<form.Subscribe
					selector={(state) => ({
						canSubmit: state.canSubmit,
						isSubmitting: state.isSubmitting,
					})}
				>
					{({ canSubmit, isSubmitting }) => (
						<Button
							type="submit"
							disabled={!canSubmit || updateProfile.isPending || isSubmitting}
						>
							{updateProfile.isPending || isSubmitting
								? "Saving…"
								: "Save changes"}
						</Button>
					)}
				</form.Subscribe>
			</form>
		</>
	);
}
