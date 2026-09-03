import { DangerCircleIcon } from "@solar-icons/react/linear";
import {
	createFileRoute,
	useNavigate,
	useRouteContext,
} from "@tanstack/react-router";
import { type ReactNode, useState } from "react";
import toast from "react-hot-toast";

import { PageTitle } from "@/components/motion/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { openBillingPortal, startProCheckout } from "@/lib/billing";
import { useProfileCore, useWipeProfileData } from "@/lib/queries/profile-data";
import { passwordSchema } from "@/lib/schemas/auth";

export const Route = createFileRoute("/_authenticated/dashboard/settings")({
	head: () => ({ meta: [{ title: "Settings — DevLinks" }] }),
	component: SettingsPage,
});

function SettingsPage() {
	const { user } = useRouteContext({ from: "/_authenticated/dashboard" });
	const navigate = useNavigate();
	const wipeProfileData = useWipeProfileData();
	const core = useProfileCore();
	const isPro = core.data?.plan === "pro";

	const [confirm, setConfirm] = useState("");
	const [pwLoading, setPwLoading] = useState(false);
	const [billingLoading, setBillingLoading] = useState(false);

	async function handleBilling() {
		setBillingLoading(true);
		try {
			if (isPro) {
				await openBillingPortal();
			} else {
				await startProCheckout();
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't open billing");
		} finally {
			setBillingLoading(false);
		}
	}

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
		<div className="mx-auto w-full max-w-6xl">
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					12 / Settings
				</p>

				<PageTitle className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Settings.
				</PageTitle>

				<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
					Manage your account, password, billing, and content.
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
						label="Billing"
						title={isPro ? "Manage subscription" : "Upgrade to Pro"}
						description={
							isPro
								? "View invoices, update your payment method, or cancel your subscription."
								: "Unlimited links, projects and snippets, analytics, custom CSS, and no DevLinks branding — $5/month."
						}
					/>

					<button
						type="button"
						onClick={handleBilling}
						disabled={billingLoading}
						className="mt-6 h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none transition-colors hover:bg-brand hover:text-brand-foreground disabled:opacity-50"
					>
						{billingLoading
							? "Loading…"
							: isPro
								? "Manage subscription"
								: "Upgrade to Pro"}
					</button>
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
							<DangerCircleIcon className="h-4 w-4" strokeWidth={1.5} />
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
