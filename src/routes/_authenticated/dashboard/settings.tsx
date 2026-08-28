import {
	createFileRoute,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { type ReactNode, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileCore } from "@/lib/api/profile-data.functions";
import { authClient } from "@/lib/auth-client";
import {
	useProfileCore,
	useUpdateDiscovery,
	useWipeProfileData,
} from "@/lib/queries/profile-data";
import { passwordSchema } from "@/lib/schemas/auth";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
	head: () => ({ meta: [{ title: "Settings — DevLinks" }] }),
	component: SettingsPage,
});

const SENIORITY_OPTIONS = [
	{ value: "", label: "—" },
	{ value: "junior", label: "Junior" },
	{ value: "mid", label: "Mid" },
	{ value: "senior", label: "Senior" },
	{ value: "staff", label: "Staff" },
	{ value: "principal", label: "Principal" },
];

type DiscoveryForm = {
	country: string;
	primaryLanguage: string;
	seniority: string;
	technologies: string;
	available: boolean;
};

function SettingsPage() {
	const { user } = useRouteContext({ from: "/_authenticated/dashboard" });
	const navigate = useNavigate();
	const wipeProfileData = useWipeProfileData();

	const [confirm, setConfirm] = useState("");
	const [pwLoading, setPwLoading] = useState(false);

	async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		const formElement = event.currentTarget;
		const formData = new FormData(formElement);

		const currentPassword = String(formData.get("currentPassword") ?? "");

		const parsedPassword = passwordSchema.safeParse(
			String(formData.get("password") ?? ""),
		);

		if (!parsedPassword.success) {
			toast.error(
				parsedPassword.error.issues[0]?.message ?? "Invalid password",
			);
			return;
		}

		setPwLoading(true);

		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword: parsedPassword.data,
			});

			if (error) {
				toast.error(error.message ?? "Couldn't update password");
			} else {
				toast.success("Password updated");
				formElement.reset();
			}
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Update failed");
		} finally {
			setPwLoading(false);
		}
	}

	async function handleSignOut() {
		await authClient.signOut();
		await navigate({ to: "/" });
	}

	async function handleWipe() {
		try {
			await wipeProfileData.mutateAsync();
			toast.success("All content wiped");
			setConfirm("");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Wipe failed");
		}
	}

	return (
		<div className="mx-auto w-full max-w-4xl">
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					10 / Settings
				</p>

				<h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Settings.
				</h1>

				<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
					Manage your account, discovery profile, password, and content.
				</p>
			</header>

			<div className="divide-y divide-border">
				<section className="py-8">
					<SectionIntro
						label="Account"
						title="Your account"
						description="Basic account information. Change your name and username from Profile."
					/>

					<div className="mt-7 grid gap-6 sm:grid-cols-2">
						<ReadOnlyField label="Email" value={user.email} />
						<ReadOnlyField label="Username" value={user.username ?? ""} mono />
					</div>
				</section>

				<DiscoverySection />

				<section className="py-8">
					<SectionIntro
						label="Security"
						title="Change password"
						description="Update the password you use to sign in to DevLinks."
					/>

					<form onSubmit={handleChangePassword} className="mt-7 max-w-2xl">
						<div className="grid gap-6 sm:grid-cols-2">
							<div>
								<Label
									htmlFor="currentPassword"
									className="font-mono text-[10px] uppercase tracking-[0.08em]"
								>
									Current password
								</Label>

								<Input
									id="currentPassword"
									name="currentPassword"
									type="password"
									autoComplete="current-password"
									className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
								/>
							</div>

							<div>
								<Label
									htmlFor="password"
									className="font-mono text-[10px] uppercase tracking-[0.08em]"
								>
									New password
								</Label>

								<Input
									id="password"
									name="password"
									type="password"
									autoComplete="new-password"
									className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
								/>
							</div>
						</div>

						<Button
							type="submit"
							disabled={pwLoading}
							className="mt-6 h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
						>
							{pwLoading ? "Updating…" : "Update password"}
						</Button>
					</form>
				</section>

				<section className="py-8">
					<SectionIntro
						label="Session"
						title="Sign out"
						description="End your current DevLinks session on this device."
					/>

					<button
						type="button"
						onClick={handleSignOut}
						className="mt-6 border border-border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
					>
						Sign out
					</button>
				</section>

				<section className="border-t border-destructive/40 py-8">
					<div className="flex items-start gap-4">
						<div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center border border-destructive/30 text-destructive">
							<AlertTriangle className="h-4 w-4" strokeWidth={1.5} />
						</div>

						<div className="min-w-0 flex-1">
							<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-destructive">
								Danger zone
							</p>

							<h2 className="mt-4 font-display text-3xl tracking-[-0.03em]">
								Wipe your content.
							</h2>

							<p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
								Delete all your links, projects, snippets, and articles. Your
								account remains active.
							</p>

							<div className="mt-6 max-w-xl">
								<Label
									htmlFor="confirm"
									className="font-mono text-[10px] uppercase tracking-[0.08em]"
								>
									Type <span className="text-foreground">{user.username}</span>{" "}
									to confirm
								</Label>

								<div className="mt-2 flex flex-col gap-3 sm:flex-row">
									<Input
										id="confirm"
										value={confirm}
										onChange={(event) => setConfirm(event.target.value)}
										className="h-10 min-w-0 flex-1 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-destructive focus-visible:ring-0"
									/>

									<Button
										variant="destructive"
										disabled={
											confirm !== user.username || wipeProfileData.isPending
										}
										onClick={handleWipe}
										className="h-10 shrink-0 rounded-none px-4 font-mono text-[10px] uppercase tracking-[0.08em] shadow-none"
									>
										{wipeProfileData.isPending ? "Wiping…" : "Wipe content"}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}

function SectionIntro({
	label,
	title,
	description,
}: {
	label: string;
	title: string;
	description?: ReactNode;
}) {
	return (
		<div>
			<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
				{label}
			</p>

			<h2 className="mt-4 font-display text-3xl tracking-[-0.03em]">{title}</h2>

			{description && (
				<p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
					{description}
				</p>
			)}
		</div>
	);
}

function ReadOnlyField({
	label,
	value,
	mono = false,
}: {
	label: string;
	value: string;
	mono?: boolean;
}) {
	return (
		<div>
			<Label className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
				{label}
			</Label>

			<div
				className={`mt-2 border-b border-border py-2 text-sm ${
					mono ? "font-mono text-xs" : ""
				}`}
			>
				{value}
			</div>
		</div>
	);
}

function DiscoverySection() {
	const core = useProfileCore();

	return (
		<section className="py-8">
			<SectionIntro
				label="Discovery"
				title="Be discoverable."
				description={
					<>
						Help other developers find you on{" "}
						<a
							href="/discover"
							className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-brand hover:decoration-brand"
						>
							Discover
						</a>
						.
					</>
				}
			/>

			{core.data ? (
				<DiscoveryForm core={core.data} />
			) : (
				<div
					className="mt-7 h-56 animate-pulse border-y border-border bg-surface/40"
					aria-busy="true"
				/>
			)}
		</section>
	);
}

function DiscoveryForm({ core }: { core: ProfileCore }) {
	const updateDiscovery = useUpdateDiscovery();

	const [disc, setDisc] = useState<DiscoveryForm>(() => ({
		country: core.country,
		primaryLanguage: core.primaryLanguage,
		seniority: core.seniority,
		technologies: core.technologies.join(", "),
		available: core.available,
	}));

	const handleCountryChange = (value: string) => {
		setDisc((current) => ({
			...current,
			country: value.toUpperCase().slice(0, 2),
		}));
	};

	async function saveDiscovery(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();

		try {
			await updateDiscovery.mutateAsync({
				country: disc.country,
				primaryLanguage: disc.primaryLanguage,
				seniority: disc.seniority,
				technologies: disc.technologies
					.split(",")
					.map((value) => value.trim())
					.filter(Boolean)
					.slice(0, 20),
				available: disc.available,
			});

			toast.success("Discovery info saved");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Save failed");
		}
	}

	return (
		<form onSubmit={saveDiscovery} className="mt-7 max-w-3xl">
			<div className="grid gap-6 sm:grid-cols-2">
				<div>
					<Label
						htmlFor="country"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Country
					</Label>

					<Input
						id="country"
						value={disc.country}
						onChange={(event) => handleCountryChange(event.target.value)}
						placeholder="DO"
						maxLength={2}
						className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-xs uppercase shadow-none focus-visible:border-brand focus-visible:ring-0"
					/>

					<p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
						ISO-2
					</p>
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
						htmlFor="seniority"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Seniority
					</Label>

					<select
						id="seniority"
						value={disc.seniority}
						onChange={(event) =>
							setDisc({
								...disc,
								seniority: event.target.value,
							})
						}
						className="mt-2 h-11 w-full appearance-none rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 text-sm text-foreground focus:border-brand focus:outline-none"
					>
						{SENIORITY_OPTIONS.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
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

				<div className="sm:col-span-2">
					<Label
						htmlFor="technologies"
						className="font-mono text-[10px] uppercase tracking-[0.08em]"
					>
						Technologies
					</Label>

					<Input
						id="technologies"
						value={disc.technologies}
						onChange={(event) =>
							setDisc({
								...disc,
								technologies: event.target.value,
							})
						}
						placeholder="React, Node.js, Postgres"
						className="mt-2 h-11 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
					/>

					<p className="mt-2 font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
						Separate technologies with commas · up to 20
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
