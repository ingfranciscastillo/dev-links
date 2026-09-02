import { CameraIcon } from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { type ChangeEvent, useRef, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	type ProfileCore,
	profileInput,
} from "@/lib/api/profile-data.functions";
import {
	useProfileCore,
	useUpdateProfile,
	useUploadAvatar,
} from "@/lib/queries/profile-data";
import { zodField } from "@/lib/schemas/field";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const Route = createFileRoute("/_authenticated/dashboard/profile")({
	head: () => ({ meta: [{ title: "Profile — DevLinks" }] }),
	component: ProfilePage,
});

function ProfilePage() {
	const core = useProfileCore();

	return (
		<div className="mx-auto w-full max-w-6xl">
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					02 / Profile
				</p>

				<h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Your profile.
				</h1>

				<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
					The information people see when they visit your public DevLinks page.
				</p>
			</header>

			{core.data ? (
				<ProfileForm core={core.data} />
			) : (
				<div className="grid max-w-3xl gap-8 pt-8" aria-busy="true">
					<FormSkeleton />
					<FormSkeleton />
				</div>
			)}
		</div>
	);
}

function FormSkeleton() {
	return (
		<div className="animate-pulse border-t border-border pt-6">
			<div className="h-5 w-32 bg-surface" />
			<div className="mt-4 h-11 w-full bg-surface" />
			<div className="mt-5 h-11 w-full bg-surface" />
		</div>
	);
}

function ProfileForm({ core }: { core: ProfileCore }) {
	const { user } = useRouteContext({ from: "/_authenticated/dashboard" });
	const router = useRouter();
	const updateProfile = useUpdateProfile();
	const uploadAvatar = useUploadAvatar();
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
	const avatarSrc = avatarPreview ?? user.image ?? null;

	async function handleAvatarChange(e: ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		e.target.value = "";
		if (!file) return;

		if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
			toast.error("Only PNG, JPG or WEBP images are allowed");
			return;
		}
		if (file.size > MAX_AVATAR_BYTES) {
			toast.error("Image must be 2MB or smaller");
			return;
		}

		const objectUrl = URL.createObjectURL(file);
		setAvatarPreview(objectUrl);

		try {
			await uploadAvatar.mutateAsync(file);
			await router.invalidate();
			toast.success("Avatar updated");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Upload failed");
		} finally {
			URL.revokeObjectURL(objectUrl);
			setAvatarPreview(null);
		}
	}

	const form = useForm({
		defaultValues: {
			name: user.name,
			username: user.username ?? "",
			bio: core.bio,
			location: core.location,
			website: core.website,
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

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				e.stopPropagation();
				form.handleSubmit();
			}}
			className="max-w-3xl pt-8"
			noValidate
		>
			<section className="border-b border-border pb-8">
				<div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-5">
						<div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border border-border bg-surface font-display text-2xl">
							{avatarSrc ? (
								<img
									src={avatarSrc}
									alt=""
									className="h-full w-full object-cover"
								/>
							) : (
								user.name.slice(0, 1).toUpperCase()
							)}

							<input
								ref={fileInputRef}
								type="file"
								accept="image/png,image/jpeg,image/webp"
								onChange={handleAvatarChange}
								className="hidden"
							/>

							<button
								type="button"
								title="Change avatar"
								aria-label="Change avatar"
								disabled={uploadAvatar.isPending}
								onClick={() => fileInputRef.current?.click()}
								className="absolute -bottom-2 -right-2 inline-flex h-7 w-7 items-center justify-center border border-border bg-background text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
							>
								<CameraIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
							</button>
						</div>

						<div>
							<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
								Avatar
							</p>

							<p className="mt-2 text-sm">Your profile image</p>

							<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
								{uploadAvatar.isPending
									? "Uploading…"
									: "PNG, JPG or WEBP, max 2MB."}
							</p>
						</div>
					</div>

					<div className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
						Public profile
					</div>
				</div>
			</section>

			<section className="border-b border-border py-8">
				<div className="mb-6">
					<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
						Identity
					</p>

					<p className="mt-2 text-sm text-muted-foreground">
						How you are identified across DevLinks.
					</p>
				</div>

				<FieldGroup>
					<div className="grid gap-6 sm:grid-cols-2">
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
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Name
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
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
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Username
										</FieldLabel>

										<div className="mt-2 flex h-11 items-center border-b border-border">
											<span className="shrink-0 font-mono text-[11px] text-muted-foreground">
												devlinks.com/
											</span>

											<Input
												id={field.name}
												name={field.name}
												value={field.state.value}
												onBlur={field.handleBlur}
												onChange={(e) =>
													field.handleChange(e.target.value.toLowerCase())
												}
												aria-invalid={invalid || undefined}
												className="h-full rounded-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
											/>
										</div>

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
			</section>

			<section className="border-b border-border py-8">
				<div className="mb-6">
					<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
						About
					</p>

					<p className="mt-2 text-sm text-muted-foreground">
						Give visitors a quick idea of who you are and what you build.
					</p>
				</div>

				<FieldGroup>
					<form.Field
						name="bio"
						validators={{
							onChange: zodField(profileInput.shape.bio),
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
										Bio
									</FieldLabel>

									<textarea
										id={field.name}
										name={field.name}
										rows={4}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Full-stack engineer building developer tools..."
										aria-invalid={invalid || undefined}
										className="mt-2 flex w-full resize-y border-b border-border bg-transparent px-0 py-3 text-sm leading-relaxed placeholder:text-muted-foreground focus:border-brand focus:outline-none"
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
				</FieldGroup>
			</section>

			<section className="border-b border-border py-8">
				<div className="mb-6">
					<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
						Details
					</p>

					<p className="mt-2 text-sm text-muted-foreground">
						Optional information displayed on your public profile.
					</p>
				</div>

				<FieldGroup>
					<div className="grid gap-6 sm:grid-cols-2">
						<form.Field name="location">
							{(field) => (
								<Field>
									<FieldLabel
										htmlFor={field.name}
										className="font-mono text-[10px] uppercase tracking-[0.08em]"
									>
										Location
									</FieldLabel>

									<Input
										id={field.name}
										name={field.name}
										value={field.state.value ?? ""}
										onBlur={field.handleBlur}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="Madrid, Spain"
										className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
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
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Website
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											type="url"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="https://your.dev"
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
					</div>
				</FieldGroup>
			</section>

			<div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
				<p className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
					Changes apply to your public page
				</p>

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
							className="h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
						>
							{updateProfile.isPending || isSubmitting
								? "Saving…"
								: "Save changes"}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</form>
	);
}
