import { CameraIcon } from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { X } from "lucide-react";
import { type ChangeEvent, type KeyboardEvent, useRef, useState } from "react";
import toast from "react-hot-toast";

import { PageTitle } from "@/components/motion/PageTitle";
import { Button } from "@/components/ui/button";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	type ProfileCore,
	profileInput,
} from "@/lib/api/profile-data.functions";
import { COUNTRIES } from "@/lib/countries";
import {
	useProfileCore,
	useUpdateDiscovery,
	useUpdateProfile,
	useUploadAvatar,
} from "@/lib/queries/profile-data";
import { zodField } from "@/lib/schemas/field";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const SENIORITY_UNSET = "none";

const SENIORITY_OPTIONS = [
	{ value: SENIORITY_UNSET, label: "Not specified" },
	{ value: "junior", label: "Junior" },
	{ value: "mid", label: "Mid" },
	{ value: "senior", label: "Senior" },
	{ value: "staff", label: "Staff" },
	{ value: "principal", label: "Principal" },
];

const COUNTRY_UNSET = "none";

type DiscoveryFormValues = {
	country: string;
	primaryLanguage: string;
	seniority: string;
	technologies: string[];
	available: boolean;
};

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

				<PageTitle className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Your profile.
				</PageTitle>

				<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
					The information people see when they visit your public DevLinks page.
				</p>
			</header>

			{core.data ? (
				<ProfileForm core={core.data} />
			) : (
				<div className="grid gap-8 pt-8" aria-busy="true">
					<FormSkeleton />
					<FormSkeleton />
				</div>
			)}

			<DiscoverySection />
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
			className="pt-8"
			noValidate
		>
			<section className="border-b border-border pb-8">
				<div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-5">
						<div
							className={`relative flex h-20 w-20 shrink-0 items-center justify-center border border-border bg-surface font-display text-2xl transition-opacity duration-300 ${
								uploadAvatar.isPending ? "opacity-60" : "opacity-100"
							}`}
						>
							{avatarSrc ? (
								<img
									key={avatarSrc}
									src={avatarSrc}
									alt=""
									className="h-full w-full object-cover opacity-100 transition-opacity duration-300 starting:opacity-0 motion-reduce:transition-none"
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
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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

function DiscoverySection() {
	const core = useProfileCore();

	return (
		<section className="border-t border-border py-8">
			<div className="mb-6">
				<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
					Discovery
				</p>

				<h2 className="mt-4 font-display text-3xl tracking-[-0.03em]">
					Be discoverable.
				</h2>

				<p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
					Help other developers find you on{" "}
					<a
						href="/discover"
						className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-brand hover:decoration-brand"
					>
						Discover
					</a>
					.
				</p>
			</div>

			{core.data ? (
				<DiscoveryForm core={core.data} />
			) : (
				<div
					className="h-56 animate-pulse border-y border-border bg-surface/40"
					aria-busy="true"
				/>
			)}
		</section>
	);
}

function DiscoveryForm({ core }: { core: ProfileCore }) {
	const updateDiscovery = useUpdateDiscovery();

	const [disc, setDisc] = useState<DiscoveryFormValues>(() => ({
		country: core.country,
		primaryLanguage: core.primaryLanguage,
		seniority: core.seniority,
		technologies: core.technologies,
		available: core.available,
	}));
	const [techInput, setTechInput] = useState("");

	function commitTech(raw: string) {
		const value = raw.trim();
		if (!value) return;
		setDisc((current) => {
			if (
				current.technologies.length >= 20 ||
				current.technologies.some(
					(t) => t.toLowerCase() === value.toLowerCase(),
				)
			) {
				return current;
			}
			return { ...current, technologies: [...current.technologies, value] };
		});
		setTechInput("");
	}

	function removeTech(value: string) {
		setDisc((current) => ({
			...current,
			technologies: current.technologies.filter((t) => t !== value),
		}));
	}

	function handleTechKeyDown(event: KeyboardEvent<HTMLInputElement>) {
		if (event.key === "," || event.key === "Enter") {
			event.preventDefault();
			commitTech(techInput);
			return;
		}
		if (
			event.key === "Backspace" &&
			!techInput &&
			disc.technologies.length > 0
		) {
			removeTech(disc.technologies[disc.technologies.length - 1]);
		}
	}

	async function saveDiscovery(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			await updateDiscovery.mutateAsync({
				country: disc.country,
				primaryLanguage: disc.primaryLanguage,
				seniority: disc.seniority,
				technologies: disc.technologies,
				available: disc.available,
			});

			toast.success("Discovery info saved");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Save failed");
		}
	}

	return (
		<form onSubmit={saveDiscovery}>
			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<Label
						htmlFor="location-select"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Location
					</Label>

					<Select
						value={disc.country || COUNTRY_UNSET}
						onValueChange={(value) =>
							setDisc({
								...disc,
								country: value === COUNTRY_UNSET ? "" : value,
							})
						}
					>
						<SelectTrigger
							id="location-select"
							className="mt-2 h-11 w-full rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus:ring-0"
						>
							<SelectValue />
						</SelectTrigger>

						<SelectContent>
							<SelectItem value={COUNTRY_UNSET}>Not specified</SelectItem>
							{COUNTRIES.map((c) => (
								<SelectItem key={c.code} value={c.code}>
									{c.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div>
					<Label
						htmlFor="primary_language"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Primary language
					</Label>

					<Input
						id="primary_language"
						value={disc.primaryLanguage}
						onChange={(event) =>
							setDisc({
								...disc,
								primaryLanguage: event.target.value,
							})
						}
						placeholder="TypeScript"
						className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
					/>
				</div>

				<div>
					<Label
						htmlFor="seniority-select"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Seniority
					</Label>

					<Select
						value={disc.seniority || SENIORITY_UNSET}
						onValueChange={(value) =>
							setDisc({
								...disc,
								seniority: value === SENIORITY_UNSET ? "" : value,
							})
						}
					>
						<SelectTrigger
							id="seniority-select"
							className="mt-2 h-11 w-full rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus:ring-0"
						>
							<SelectValue />
						</SelectTrigger>

						<SelectContent>
							{SENIORITY_OPTIONS.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="flex items-end">
					<label className="inline-flex cursor-pointer items-center gap-3 pb-2">
						<input
							type="checkbox"
							checked={disc.available}
							onChange={(event) =>
								setDisc({
									...disc,
									available: event.target.checked,
								})
							}
							className="h-4 w-4 accent-(--color-brand)"
						/>

						<span className="text-sm">Available for hire</span>
					</label>
				</div>

				<div className="sm:col-span-2 lg:col-span-4">
					<Label
						htmlFor="technologies"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Technologies
					</Label>

					<div className="mt-2 flex flex-wrap items-center gap-2 border-b border-border py-2">
						{disc.technologies.map((tech) => (
							<span
								key={tech}
								className="inline-flex items-center gap-1.5 border border-border bg-surface px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em]"
							>
								{tech}
								<button
									type="button"
									onClick={() => removeTech(tech)}
									aria-label={`Remove ${tech}`}
									className="text-muted-foreground transition-colors hover:text-foreground"
								>
									<X className="h-3 w-3" />
								</button>
							</span>
						))}

						<input
							id="technologies"
							value={techInput}
							onChange={(event) => setTechInput(event.target.value)}
							onKeyDown={handleTechKeyDown}
							onBlur={() => commitTech(techInput)}
							placeholder={
								disc.technologies.length === 0
									? "React, Node.js, Postgres…"
									: undefined
							}
							disabled={disc.technologies.length >= 20}
							className="h-7 min-w-24 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
						/>
					</div>

					<p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
						Press comma or enter to add · up to 20
					</p>
				</div>
			</div>

			<div className="mt-7 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
				<p className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
					Used by Discover
				</p>

				<Button
					type="submit"
					disabled={updateDiscovery.isPending}
					className="h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
				>
					{updateDiscovery.isPending ? "Saving…" : "Save discovery info"}
				</Button>
			</div>
		</form>
	);
}
