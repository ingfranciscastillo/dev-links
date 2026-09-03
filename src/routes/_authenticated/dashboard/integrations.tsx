import {
	DangerCircleIcon,
	DisketteIcon,
	RefreshIcon,
	TrashBin2Icon,
} from "@solar-icons/react/linear";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { PageTitle } from "@/components/motion/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IntegrationAccount } from "@/lib/api/integrations/account.functions";
import {
	PROVIDER_LABEL,
	PROVIDERS,
	type Provider,
} from "@/lib/integrations/types";
import {
	useDeleteIntegrationAccount,
	useIntegrationAccounts,
	useRefreshIntegration,
	useUpsertIntegrationAccount,
} from "@/lib/queries/integrations";

export const Route = createFileRoute("/_authenticated/dashboard/integrations")({
	head: () => ({
		meta: [
			{ title: "Integrations — DevLinks" },
			{
				name: "description",
				content:
					"Connect GitHub, Dev.to, Medium, Stack Overflow, WakaTime, LeetCode, npm, Bluesky, Mastodon, Docker Hub and YouTube to your DevLinks profile.",
			},
		],
	}),
	component: IntegrationsPage,
});

type ConfigField = {
	key: string;
	label: string;
	placeholder: string;
};

const PROVIDER_HELP: Record<
	Provider,
	{
		placeholder: string;
		helper: string;
		configField?: ConfigField;
	}
> = {
	github: {
		placeholder: "octocat",
		helper: "Your public GitHub username.",
	},
	devto: {
		placeholder: "ben",
		helper: "Your Dev.to username.",
	},
	medium: {
		placeholder: "yourname",
		helper: "Your Medium handle without the @.",
	},
	stackoverflow: {
		placeholder: "22656",
		helper:
			"Your numeric Stack Overflow user id (find it in your profile URL).",
	},
	wakatime: {
		placeholder: "yourusername",
		helper: "Your WakaTime username.",
	},
	leetcode: {
		placeholder: "yourusername",
		helper: "Your LeetCode username.",
	},
	npm: {
		placeholder: "yourusername",
		helper: "Your npm username.",
	},
	bluesky: {
		placeholder: "you.bsky.social",
		helper: "Your Bluesky handle.",
	},
	mastodon: {
		placeholder: "@you@mastodon.social",
		helper: "Your Mastodon handle.",
	},
	dockerhub: {
		placeholder: "yourusername",
		helper: "Your Docker Hub username.",
	},
	youtube: {
		placeholder: "@yourchannel",
		helper: "Your YouTube channel handle.",
	},
};

function IntegrationsPage() {
	const { data: accounts } = useIntegrationAccounts();

	return (
		<>
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					07 / Integrations
				</p>

				<div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
					<div className="min-w-0">
						<PageTitle className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							Integrations.
						</PageTitle>

						<p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Connect the services you use and keep your DevLinks profile
							updated automatically.
						</p>
					</div>

					<p className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
						Sync every 6h
					</p>
				</div>
			</header>

			<div className="mt-8 border-t border-border">
				{PROVIDERS.map((provider, index) => {
					const account =
						accounts?.find((item) => item.provider === provider) ?? null;

					return (
						<IntegrationRow
							key={provider}
							index={index}
							provider={provider}
							account={account}
						/>
					);
				})}
			</div>
		</>
	);
}

function IntegrationRow({
	provider,
	account,
	index,
}: {
	provider: Provider;
	account: IntegrationAccount | null;
	index: number;
}) {
	const help = PROVIDER_HELP[provider];

	const [handle, setHandle] = useState(account?.handle ?? "");
	const [configValue, setConfigValue] = useState(
		help.configField
			? String((account?.config?.[help.configField.key] as string) ?? "")
			: "",
	);

	const [confirmingDelete, setConfirmingDelete] = useState(false);

	const upsertAccount = useUpsertIntegrationAccount();
	const deleteAccount = useDeleteIntegrationAccount();
	const refreshAccount = useRefreshIntegration();

	const busy =
		upsertAccount.isPending ||
		refreshAccount.isPending ||
		deleteAccount.isPending;

	useEffect(() => {
		setHandle(account?.handle ?? "");

		if (help.configField) {
			setConfigValue(
				String((account?.config?.[help.configField.key] as string) ?? ""),
			);
		}
	}, [account, help.configField]);

	async function handleSave() {
		if (!handle.trim()) {
			toast.error("Handle is required");
			return;
		}

		try {
			const config: Record<string, string> = {};

			if (help.configField && configValue.trim()) {
				config[help.configField.key] = configValue.trim();
			}

			await upsertAccount.mutateAsync({
				provider,
				handle: handle.trim(),
				config,
			});

			toast.success(`${PROVIDER_LABEL[provider]} saved`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Save failed");
		}
	}

	async function handleSync() {
		try {
			const result = await refreshAccount.mutateAsync(provider);

			toast.success(
				`Synced ${PROVIDER_LABEL[provider]} (${result.kinds.join(", ")})`,
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Sync failed");
		}
	}

	async function handleDelete() {
		try {
			await deleteAccount.mutateAsync(provider);
			toast.success(`${PROVIDER_LABEL[provider]} disconnected`);
			setConfirmingDelete(false);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Delete failed");
		}
	}

	return (
		<article className="border-b border-border py-7 sm:py-8">
			<div className="grid min-w-0 gap-7 lg:grid-cols-[minmax(11rem,15rem)_minmax(0,1fr)_auto] lg:items-start lg:gap-10">
				{/* Provider */}
				<div className="min-w-0">
					<div className="flex items-start gap-3">
						<span className="mt-1 shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">
							{String(index + 1).padStart(2, "0")}
						</span>

						<h2 className="min-w-0 wrap-break-word font-display text-2xl leading-tight tracking-tight sm:text-3xl">
							{PROVIDER_LABEL[provider]}
						</h2>
					</div>

					<p className="mt-3 max-w-[30ch] text-sm leading-relaxed text-muted-foreground">
						{help.helper}
					</p>

					<div className="mt-4">
						{account?.lastSyncedAt ? (
							<p className="flex items-start gap-2 font-mono text-[9px] uppercase leading-relaxed tracking-[0.07em] text-brand">
								<DangerCircleIcon
									className="mt-0.5 h-3 w-3 shrink-0"
									strokeWidth={1.5}
								/>
								<span>
									Synced {new Date(account.lastSyncedAt).toLocaleString()}
								</span>
							</p>
						) : (
							<p className="font-mono text-[9px] uppercase tracking-[0.07em] text-muted-foreground">
								Not synced yet
							</p>
						)}

						{account?.lastError && (
							<p className="mt-2 flex items-start gap-2 text-xs leading-relaxed text-destructive">
								<DangerCircleIcon
									className="mt-0.5 h-3.5 w-3.5 shrink-0"
									strokeWidth={1.5}
								/>
								<span className="min-w-0 wrap-break-word">
									{account.lastError}
								</span>
							</p>
						)}
					</div>
				</div>

				{/* Configuration */}
				<div
					className={`grid min-w-0 gap-5 ${
						help.configField ? "sm:grid-cols-2" : "sm:grid-cols-1"
					}`}
				>
					<div className="min-w-0">
						<Label
							htmlFor={`${provider}-handle`}
							className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground"
						>
							Handle
						</Label>

						<Input
							id={`${provider}-handle`}
							value={handle}
							onChange={(event) => setHandle(event.target.value)}
							placeholder={help.placeholder}
							className="mt-2 h-10 min-w-0 w-full rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
						/>
					</div>

					{help.configField && (
						<div className="min-w-0">
							<Label
								htmlFor={`${provider}-${help.configField.key}`}
								className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground"
							>
								{help.configField.label}
							</Label>

							<Input
								id={`${provider}-${help.configField.key}`}
								value={configValue}
								onChange={(event) => setConfigValue(event.target.value)}
								placeholder={help.configField.placeholder}
								className="mt-2 h-10 min-w-0 w-full rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 shadow-none focus-visible:border-brand focus-visible:ring-0"
							/>
						</div>
					)}
				</div>

				{/* Actions */}
				<div className="flex flex-wrap items-center gap-3 lg:justify-end">
					<Button
						onClick={handleSave}
						disabled={busy}
						className="h-9 rounded-none bg-foreground px-3 font-mono text-[9px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
					>
						<DisketteIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
						{account ? "Update" : "Connect"}
					</Button>

					<Button
						onClick={handleSync}
						disabled={busy || !account}
						variant="outline"
						className="h-9 rounded-none border-border px-3 font-mono text-[9px] uppercase tracking-[0.08em]"
					>
						<RefreshIcon
							className={
								refreshAccount.isPending
									? "h-3.5 w-3.5 animate-spin"
									: "h-3.5 w-3.5"
							}
							strokeWidth={1.5}
						/>
						Sync
					</Button>

					{account && (
						<button
							type="button"
							onClick={() => setConfirmingDelete(true)}
							disabled={busy}
							className="inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
							title="Disconnect"
							aria-label={`Disconnect ${PROVIDER_LABEL[provider]}`}
						>
							<TrashBin2Icon size={15} strokeWidth={1.5} />
						</button>
					)}
				</div>
			</div>

			{confirmingDelete && (
				<ConfirmDialog
					title="Disconnect integration"
					description={`This removes ${PROVIDER_LABEL[provider]} and its cached data from your profile. You can reconnect it anytime.`}
					confirmLabel="Disconnect"
					pending={deleteAccount.isPending}
					onClose={() => setConfirmingDelete(false)}
					onConfirm={handleDelete}
				/>
			)}
		</article>
	);
}
