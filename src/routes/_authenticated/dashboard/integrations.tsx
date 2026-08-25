import { createFileRoute } from "@tanstack/react-router";
import {
	AlertCircle,
	CheckCircle2,
	Plug,
	RefreshCw,
	Save,
	Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
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
					"Connect GitHub, Dev.to, Hashnode, Medium and Stack Overflow to your DevLinks profile.",
			},
		],
	}),
	component: IntegrationsPage,
});

type ConfigField = { key: string; label: string; placeholder: string };

const PROVIDER_HELP: Record<
	Provider,
	{ placeholder: string; helper: string; configField?: ConfigField }
> = {
	github: {
		placeholder: "octocat",
		helper: "Your public GitHub username.",
	},
	devto: { placeholder: "ben", helper: "Your Dev.to username." },
	hashnode: {
		placeholder: "you",
		helper: "Any identifier.",
		configField: {
			key: "host",
			label: "Publication host",
			placeholder: "you.hashnode.dev",
		},
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
};

function IntegrationsPage() {
	const { data: accounts } = useIntegrationAccounts();

	return (
		<>
			<SectionHeader
				eyebrow="Live"
				title="Integrations"
				description="Pull in real activity from GitHub, Dev.to, Hashnode, Medium and Stack Overflow. Refreshed every 6h."
			/>
			<div className="grid gap-4">
				{PROVIDERS.map((provider) => {
					const account =
						accounts?.find((a) => a.provider === provider) ?? null;
					return (
						<IntegrationCard
							key={provider}
							provider={provider}
							account={account}
						/>
					);
				})}
			</div>
		</>
	);
}

function IntegrationCard({
	provider,
	account,
}: {
	provider: Provider;
	account: IntegrationAccount | null;
}) {
	const help = PROVIDER_HELP[provider];
	const [handle, setHandle] = useState(account?.handle ?? "");
	const [configValue, setConfigValue] = useState<string>(
		help.configField
			? String((account?.config?.[help.configField.key] as string) ?? "")
			: "",
	);

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
			const res = await refreshAccount.mutateAsync(provider);
			toast.success(
				`Synced ${PROVIDER_LABEL[provider]} (${res.kinds.join(", ")})`,
			);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Sync failed");
		}
	}

	async function handleDelete() {
		if (!window.confirm(`Disconnect ${PROVIDER_LABEL[provider]}?`)) return;
		try {
			await deleteAccount.mutateAsync(provider);
			toast.success(`${PROVIDER_LABEL[provider]} disconnected`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Delete failed");
		}
	}

	return (
		<div className="rounded-xl border border-hairline bg-surface p-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div>
					<h3 className="flex items-center gap-2 text-base font-semibold">
						<Plug className="h-4 w-4 text-muted-foreground" />
						{PROVIDER_LABEL[provider]}
					</h3>
					<p className="mt-1 text-xs text-muted-foreground">{help.helper}</p>
				</div>
				<div className="text-right text-[11px] text-muted-foreground">
					{account?.lastSyncedAt ? (
						<span className="inline-flex items-center gap-1">
							<CheckCircle2 className="h-3 w-3 text-emerald-500" />
							Synced {new Date(account.lastSyncedAt).toLocaleString()}
						</span>
					) : (
						<span>Not synced yet</span>
					)}
					{account?.lastError && (
						<p className="mt-1 inline-flex items-center gap-1 text-amber-500">
							<AlertCircle className="h-3 w-3" /> {account.lastError}
						</p>
					)}
				</div>
			</div>

			<div className="mt-4 grid gap-3 sm:grid-cols-2">
				<div>
					<Label className="text-xs">Handle</Label>
					<Input
						value={handle}
						onChange={(e) => setHandle(e.target.value)}
						placeholder={help.placeholder}
					/>
				</div>
				{help.configField && (
					<div>
						<Label className="text-xs">{help.configField.label}</Label>
						<Input
							value={configValue}
							onChange={(e) => setConfigValue(e.target.value)}
							placeholder={help.configField.placeholder}
						/>
					</div>
				)}
			</div>

			<div className="mt-4 flex flex-wrap gap-2">
				<Button onClick={handleSave} disabled={busy} size="sm">
					<Save className="mr-1.5 h-3.5 w-3.5" />
					{account ? "Update" : "Connect"}
				</Button>
				<Button
					onClick={handleSync}
					disabled={busy || !account}
					size="sm"
					variant="outline"
				>
					<RefreshCw
						className={`mr-1.5 h-3.5 w-3.5 ${refreshAccount.isPending ? "animate-spin" : ""}`}
					/>
					Sync now
				</Button>
				{account && (
					<Button
						onClick={handleDelete}
						disabled={busy}
						size="sm"
						variant="ghost"
						className="text-muted-foreground"
					>
						<Trash2 className="mr-1.5 h-3.5 w-3.5" />
						Disconnect
					</Button>
				)}
			</div>
		</div>
	);
}
