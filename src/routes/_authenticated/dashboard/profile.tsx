import { CameraIcon, CloseIcon } from "@solar-icons/react/linear";
import { useForm } from "@tanstack/react-form";
import {
	createFileRoute,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { useReducedMotion } from "motion/react";
import {
	type ChangeEvent,
	type KeyboardEvent,
	useEffect,
	useRef,
	useState,
} from "react";
import toast from "react-hot-toast";

import {
	UsernameField,
	type UsernameStatus,
} from "@/components/auth/UsernameField";
import { SOCIAL_PLATFORM_ICONS } from "@/components/brand-icons";
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
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	BIO_MAX_LENGTH,
	type ProfileCore,
	profileInput,
} from "@/lib/api/profile-data.functions";
import { COUNTRIES } from "@/lib/countries";
import { LANGUAGES } from "@/lib/languages";
import {
	useProfileCore,
	useUpdateDiscovery,
	useUpdateProfile,
	useUploadAvatar,
} from "@/lib/queries/profile-data";
import { zodField } from "@/lib/schemas/field";
import { SOCIAL_PLATFORMS } from "@/lib/social-links";
import { TECHNOLOGY_SUGGESTIONS } from "@/lib/technologies";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

const BIO_PLACEHOLDER_PHRASES = [
	"Full-stack engineer building developer tools...",
	"Shipping side projects on nights and weekends...",
	"Turning coffee into commits since 2018...",
	"Open source maintainer, occasional blogger...",
];

const TYPE_MS = 35;
const DELETE_MS = 20;
const PAUSE_MS = 1600;

// Placeholder animado tipo typewriter, cicla BIO_PLACEHOLDER_PHRASES mientras
// el campo esté vacío. Vive encima del textarea (bg-transparent) y desaparece
// en cuanto hay valor — el placeholder nativo no puede animarse.
function AnimatedBioPlaceholder() {
	const reduceMotion = useReducedMotion();
	const [phraseIndex, setPhraseIndex] = useState(0);
	const [text, setText] = useState("");
	const [phase, setPhase] = useState<"typing" | "deleting">("typing");

	useEffect(() => {
		if (reduceMotion) {
			setText(BIO_PLACEHOLDER_PHRASES[0]);
			return;
		}

		const phrase = BIO_PLACEHOLDER_PHRASES[phraseIndex];

		if (phase === "typing") {
			if (text.length < phrase.length) {
				const id = setTimeout(
					() => setText(phrase.slice(0, text.length + 1)),
					TYPE_MS,
				);
				return () => clearTimeout(id);
			}
			const id = setTimeout(() => setPhase("deleting"), PAUSE_MS);
			return () => clearTimeout(id);
		}

		if (text.length > 0) {
			const id = setTimeout(
				() => setText(phrase.slice(0, text.length - 1)),
				DELETE_MS,
			);
			return () => clearTimeout(id);
		}
		setPhraseIndex((i) => (i + 1) % BIO_PLACEHOLDER_PHRASES.length);
		setPhase("typing");
	}, [text, phase, phraseIndex, reduceMotion]);

	return (
		<p
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 py-3 text-sm leading-relaxed text-muted-foreground"
		>
			{text}
			<span className="animate-pulse">|</span>
		</p>
	);
}

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

const LANGUAGE_UNSET = "none";

type DiscoveryFormValues = {
	country: string;
	primaryLanguage: string;
	seniority: string;
	technologies: string[];
	available: boolean;
	discoverable: boolean;
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
	const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");

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
			calendarLink: core.calendarLink,
			socialLinks: core.socialLinks,
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
									<UsernameField
										id={field.name}
										name={field.name}
										value={field.state.value}
										currentUsername={user.username ?? ""}
										invalid={invalid}
										errors={field.state.meta.errors}
										onChange={(value) => field.handleChange(value)}
										onBlur={field.handleBlur}
										onStatusChange={setUsernameStatus}
									/>
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

							const length = (field.state.value ?? "").length;
							const remaining = BIO_MAX_LENGTH - length;

							return (
								<Field data-invalid={invalid}>
									<div className="flex items-center justify-between gap-4">
										<FieldLabel
											htmlFor={field.name}
											className="font-mono text-[10px] uppercase tracking-[0.08em]"
										>
											Bio
										</FieldLabel>

										<span
											className={`font-mono text-[9px] tabular-nums ${
												remaining < 0
													? "text-destructive"
													: "text-muted-foreground"
											}`}
										>
											{length}/{BIO_MAX_LENGTH}
										</span>
									</div>

									<div className="relative mt-2">
										{!field.state.value && <AnimatedBioPlaceholder />}

										<textarea
											id={field.name}
											name={field.name}
											rows={4}
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											aria-invalid={invalid || undefined}
											className="relative flex w-full resize-y border-b border-border bg-transparent px-0 py-3 text-sm leading-relaxed focus:border-brand focus:outline-none"
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

					<div className="mt-6 grid gap-6 sm:grid-cols-2">
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

						<form.Field
							name="calendarLink"
							validators={{
								onChange: zodField(profileInput.shape.calendarLink),
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
											Calendar link
										</FieldLabel>

										<Input
											id={field.name}
											name={field.name}
											type="url"
											value={field.state.value ?? ""}
											onBlur={field.handleBlur}
											onChange={(e) => field.handleChange(e.target.value)}
											placeholder="https://cal.com/your-name"
											aria-invalid={invalid || undefined}
											className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
										/>

										{invalid ? (
											<FieldError>
												{field.state.meta.errors.join(", ")}
											</FieldError>
										) : (
											<p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
												Cal.com or Calendly URL
											</p>
										)}
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
						Social links
					</p>

					<p className="mt-2 text-sm text-muted-foreground">
						You only need to add your{" "}
						<span className="text-foreground">username</span>.
					</p>
				</div>

				<FieldGroup>
					<div className="grid gap-6 sm:grid-cols-2">
						{SOCIAL_PLATFORMS.map((platform) => {
							const Icon = SOCIAL_PLATFORM_ICONS[platform.key];

							return (
								<form.Field
									key={platform.key}
									name={`socialLinks.${platform.key}`}
								>
									{(field) => (
										<Field>
											<FieldLabel
												htmlFor={field.name}
												className="font-mono text-[10px] uppercase tracking-[0.08em]"
											>
												{platform.label}
											</FieldLabel>

											<div className="mt-2 flex h-11 items-center gap-2 border-b border-border transition-colors focus-within:border-brand">
												<Icon
													size={14}
													className="shrink-0 text-muted-foreground"
												/>

												{platform.prefix ? (
													<span className="shrink-0 font-mono text-[11px] text-muted-foreground">
														{platform.prefix}
													</span>
												) : null}

												<Input
													id={field.name}
													name={field.name}
													value={field.state.value ?? ""}
													onBlur={field.handleBlur}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder={platform.placeholder}
													autoComplete="off"
													className="h-full flex-1 rounded-none border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
												/>
											</div>

											{platform.helper ? (
												<p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
													{platform.helper}
												</p>
											) : null}
										</Field>
									)}
								</form.Field>
							);
						})}
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
							disabled={
								!canSubmit ||
								updateProfile.isPending ||
								isSubmitting ||
								usernameStatus === "checking" ||
								usernameStatus === "taken"
							}
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
		discoverable: core.discoverable,
	}));
	const [techInput, setTechInput] = useState("");
	const [techFocused, setTechFocused] = useState(false);

	const techSuggestions = (() => {
		const query = techInput.trim().toLowerCase();
		if (!query) return [];
		const chosen = new Set(disc.technologies.map((t) => t.toLowerCase()));
		return TECHNOLOGY_SUGGESTIONS.filter(
			(t) => t.toLowerCase().includes(query) && !chosen.has(t.toLowerCase()),
		).slice(0, 8);
	})();

	// Preserva un valor libre guardado antes de que este campo fuera un
	// select (o cualquiera fuera de la lista curada) en vez de ocultarlo.
	const languageOptions = LANGUAGES.includes(core.primaryLanguage)
		? LANGUAGES
		: core.primaryLanguage
			? [core.primaryLanguage, ...LANGUAGES]
			: LANGUAGES;

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
				discoverable: disc.discoverable,
			});

			toast.success("Discovery info saved");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Save failed");
		}
	}

	return (
		<form onSubmit={saveDiscovery}>
			<label className="mb-6 flex cursor-pointer items-start gap-3 border border-border p-4">
				<input
					type="checkbox"
					checked={disc.discoverable}
					onChange={(event) =>
						setDisc({ ...disc, discoverable: event.target.checked })
					}
					className="mt-0.5 h-4 w-4 shrink-0 accent-(--color-brand)"
				/>

				<span>
					<span className="block text-sm font-medium">List me on Discover</span>
					<span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
						Off by default. Turn this on to appear in{" "}
						<a
							href="/discover"
							className="underline decoration-border underline-offset-4 hover:text-foreground hover:decoration-brand"
						>
							/discover
						</a>{" "}
						search results — your profile stays reachable at its URL either way.
					</span>
				</span>
			</label>

			<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				<div>
					<Label
						htmlFor="location-select"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Location
					</Label>

					<SearchableSelect
						id="location-select"
						value={disc.country || COUNTRY_UNSET}
						onValueChange={(value) =>
							setDisc({
								...disc,
								country: value === COUNTRY_UNSET ? "" : value,
							})
						}
						options={[
							{ value: COUNTRY_UNSET, label: "Not specified" },
							...COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
						]}
						searchPlaceholder="Search countries…"
						emptyText="No country found."
						className="mt-2 h-11 border-b border-border focus-visible:border-brand"
					/>
				</div>

				<div>
					<Label
						htmlFor="primary-language-select"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Primary language
					</Label>

					<SearchableSelect
						id="primary-language-select"
						value={disc.primaryLanguage || LANGUAGE_UNSET}
						onValueChange={(value) =>
							setDisc({
								...disc,
								primaryLanguage: value === LANGUAGE_UNSET ? "" : value,
							})
						}
						options={[
							{ value: LANGUAGE_UNSET, label: "Not specified" },
							...languageOptions.map((lang) => ({ value: lang, label: lang })),
						]}
						searchPlaceholder="Search languages…"
						emptyText="No language found."
						className="mt-2 h-11 border-b border-border focus-visible:border-brand"
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

					<div className="relative">
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
										<CloseIcon className="h-3 w-3" />
									</button>
								</span>
							))}

							<input
								id="technologies"
								value={techInput}
								onChange={(event) => setTechInput(event.target.value)}
								onKeyDown={handleTechKeyDown}
								onFocus={() => setTechFocused(true)}
								onBlur={() => {
									commitTech(techInput);
									setTechFocused(false);
								}}
								placeholder={
									disc.technologies.length === 0
										? "React, Node.js, Postgres…"
										: undefined
								}
								disabled={disc.technologies.length >= 20}
								autoComplete="off"
								className="h-7 min-w-24 flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed"
							/>
						</div>

						{techFocused && techSuggestions.length > 0 ? (
							<ul className="absolute inset-x-0 top-full z-10 mt-1 border border-border bg-surface shadow-sm">
								{techSuggestions.map((suggestion) => (
									<li key={suggestion}>
										<button
											type="button"
											// onMouseDown (not onClick) fires before the input's onBlur,
											// and preventDefault keeps focus in the input instead of
											// letting blur commit the raw partial text first.
											onMouseDown={(event) => {
												event.preventDefault();
												commitTech(suggestion);
											}}
											className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background"
										>
											{suggestion}
										</button>
									</li>
								))}
							</ul>
						) : null}
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
