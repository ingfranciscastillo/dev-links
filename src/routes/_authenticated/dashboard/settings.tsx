import {
	createFileRoute,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import {
	useUpdateDiscovery,
	useWipeProfileData,
} from "@/lib/queries/profile-data";

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

function SettingsPage() {
	const { user } = useRouteContext({ from: "/_authenticated/dashboard" });
	const navigate = useNavigate();
	const updateDiscovery = useUpdateDiscovery();
	const wipeProfileData = useWipeProfileData();
	const [confirm, setConfirm] = useState("");
	const [pwLoading, setPwLoading] = useState(false);
	const [disc, setDisc] = useState({
		country: "",
		primaryLanguage: "",
		seniority: "",
		technologies: "",
		available: false,
	});

	const handleCountryChange = (raw: string) => {
		setDisc((d) => ({
			...d,
			country: raw.toUpperCase().slice(0, 2),
		}));
	};

	async function saveDiscovery(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		try {
			await updateDiscovery.mutateAsync({
				country: disc.country,
				primaryLanguage: disc.primaryLanguage,
				seniority: disc.seniority,
				technologies: disc.technologies
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
					.slice(0, 20),
				available: disc.available,
			});
			toast.success("Discovery info saved");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		}
	}

	async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const fd = new FormData(e.currentTarget);
		const currentPassword = String(fd.get("currentPassword") ?? "");
		const newPassword = String(fd.get("password") ?? "");
		if (newPassword.length < 6) {
			toast.error("At least 6 characters");
			return;
		}
		setPwLoading(true);
		try {
			const { error } = await authClient.changePassword({
				currentPassword,
				newPassword,
			});
			if (error) {
				toast.error(error.message ?? "Couldn't update password");
			} else {
				toast.success("Password updated");
				e.currentTarget.reset();
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Update failed");
		} finally {
			setPwLoading(false);
		}
	}

	async function handleWipe() {
		try {
			await wipeProfileData.mutateAsync();
			toast.success("All content wiped");
			setConfirm("");
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Wipe failed");
		}
	}

	async function handleSignOut() {
		await authClient.signOut();
		navigate({ to: "/" });
	}

	return (
		<>
			<SectionHeader
				eyebrow="Account"
				title="Settings"
				description="Manage your DevLinks account."
			/>

			<div className="max-w-2xl flex flex-col gap-6">
				<section className="rounded-xl border border-hairline bg-surface/40 p-6">
					<h2 className="text-base font-semibold">Account</h2>
					<div className="mt-4 grid gap-4 sm:grid-cols-2">
						<div className="space-y-1.5">
							<Label>Email</Label>
							<Input value={user.email} readOnly />
						</div>
						<div className="space-y-1.5">
							<Label>Username</Label>
							<Input value={user.username ?? ""} readOnly />
						</div>
					</div>
					<p className="mt-3 text-xs text-muted-foreground">
						Update name/username from the Profile tab.
					</p>
				</section>

				<section className="rounded-xl border border-hairline bg-surface/40 p-6">
					<h2 className="text-base font-semibold">Discovery</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						Help other developers find you on{" "}
						<a href="/discover" className="underline">
							Discover
						</a>
						.
					</p>
					<form
						onSubmit={saveDiscovery}
						className="mt-4 grid gap-4 sm:grid-cols-2"
					>
						<div className="space-y-1.5">
							<Label htmlFor="country">Country (ISO-2)</Label>
							<Input
								id="country"
								value={disc.country}
								onChange={(e) => handleCountryChange(e.target.value)}
								placeholder="ES"
								maxLength={2}
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="primary_language">Primary language</Label>
							<Input
								id="primary_language"
								value={disc.primaryLanguage}
								onChange={(e) =>
									setDisc({
										...disc,
										primaryLanguage: e.target.value,
									})
								}
								placeholder="TypeScript"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="seniority">Seniority</Label>
							<select
								id="seniority"
								value={disc.seniority}
								onChange={(e) =>
									setDisc({ ...disc, seniority: e.target.value })
								}
								className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								{SENIORITY_OPTIONS.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
						<div className="space-y-1.5">
							<Label className="flex items-center gap-2">
								<input
									type="checkbox"
									checked={disc.available}
									onChange={(e) =>
										setDisc({
											...disc,
											available: e.target.checked,
										})
									}
									className="h-4 w-4 rounded border-input"
								/>
								Available for hire
							</Label>
						</div>
						<div className="sm:col-span-2 space-y-1.5">
							<Label htmlFor="technologies">
								Technologies (comma-separated)
							</Label>
							<Input
								id="technologies"
								value={disc.technologies}
								onChange={(e) =>
									setDisc({
										...disc,
										technologies: e.target.value,
									})
								}
								placeholder="React, Node.js, Postgres"
							/>
						</div>
						<div className="sm:col-span-2">
							<Button type="submit" disabled={updateDiscovery.isPending}>
								{updateDiscovery.isPending ? "Saving…" : "Save discovery info"}
							</Button>
						</div>
					</form>
				</section>

				<section className="rounded-xl border border-hairline bg-surface/40 p-6">
					<h2 className="text-base font-semibold">Change password</h2>
					<form onSubmit={handleChangePassword} className="mt-4 space-y-3">
						<div className="space-y-1.5">
							<Label htmlFor="currentPassword">Current password</Label>
							<Input
								id="currentPassword"
								name="currentPassword"
								type="password"
								autoComplete="current-password"
							/>
						</div>
						<div className="space-y-1.5">
							<Label htmlFor="password">New password</Label>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="new-password"
							/>
						</div>
						<Button type="submit" disabled={pwLoading}>
							{pwLoading ? "Updating…" : "Update password"}
						</Button>
					</form>
				</section>

				<section className="rounded-xl border border-hairline bg-surface/40 p-6">
					<h2 className="text-base font-semibold">Sign out</h2>
					<p className="mt-1 text-sm text-muted-foreground">
						End your session on this device.
					</p>
					<Button variant="outline" className="mt-4" onClick={handleSignOut}>
						Sign out
					</Button>
				</section>

				<section className="rounded-xl border border-destructive/40 bg-destructive/5 p-6">
					<div className="flex items-start gap-3">
						<AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
						<div className="flex-1">
							<h2 className="text-base font-semibold">Danger zone</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Delete all your links, projects, snippets and articles. Your
								account stays active.
							</p>
							<div className="mt-4 space-y-2">
								<Label htmlFor="confirm">
									Type <span className="font-mono">{user.username}</span> to
									confirm
								</Label>
								<div className="flex gap-2">
									<Input
										id="confirm"
										value={confirm}
										onChange={(e) => setConfirm(e.target.value)}
									/>
									<Button
										variant="destructive"
										disabled={
											confirm !== user.username || wipeProfileData.isPending
										}
										onClick={handleWipe}
									>
										{wipeProfileData.isPending ? "Wiping…" : "Wipe content"}
									</Button>
								</div>
							</div>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
