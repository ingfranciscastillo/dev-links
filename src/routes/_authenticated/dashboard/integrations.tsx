import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
	AlertCircle,
	CheckCircle2,
	Plug,
	RefreshCw,
	Save,
	Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	deleteIntegrationAccount,
	type IntegrationAccount,
	listMyIntegrationAccounts,
	refreshIntegration,
	upsertIntegrationAccount,
} from "@/lib/api/integrations/account.functions";
import {
	PROVIDER_LABEL,
	PROVIDERS,
	type Provider,
} from "@/lib/integrations/types";

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
	const [accounts, setAccounts] = useState<IntegrationAccount[] | null>(null);
	const list = useServerFn(listMyIntegrationAccounts);

	const reload = useCallback(async () => {
		try {
			const data = await list();
			setAccounts(data);
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Failed to load");
		}
	}, [list]);

	useEffect(() => {
		reload();
	}, [reload]);

	return (
		<DashboardShell>
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
							onChanged={reload}
						/>
					);
				})}
			</div>
		</DashboardShell>
	);
}

function IntegrationCard({
	provider,
	account,
	onChanged,
}: {
	provider: Provider;
	account: IntegrationAccount | null;
	onChanged: () => void;
}) {
	const help = PROVIDER_HELP[provider];
	const [handle, setHandle] = useState(account?.handle ?? "");
	const [configValue, setConfigValue] = useState<string>(
		help.configField
			? String((account?.config?.[help.configField.key] as string) ?? "")
			: "",
	);
	const [busy, setBusy] = useState<"save" | "sync" | "delete" | null>(null);
	const upsert = useServerFn(upsertIntegrationAccount);
	const del = useServerFn(deleteIntegrationAccount);
	const refresh = useServerFn(refreshIntegration);

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
			window.alert("Handle is required");
			return;
		}
		setBusy("save");
		try {
			const config: Record<string, string> = {};
			if (help.configField && configValue.trim()) {
				config[help.configField.key] = configValue.trim();
			}
			await upsert({
				data: { provider, handle: handle.trim(), config },
			});
			window.alert(`${PROVIDER_LABEL[provider]} saved`);
			onChanged();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Save failed");
		} finally {
			setBusy(null);
		}
	}

	async function handleSync() {
		setBusy("sync");
		try {
			const res = await refresh({ data: { provider } });
			window.alert(
				`Synced ${PROVIDER_LABEL[provider]} (${res.kinds.join(", ")})`,
			);
			onChanged();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Sync failed");
			onChanged();
		} finally {
			setBusy(null);
		}
	}

	async function handleDelete() {
		if (!window.confirm(`Disconnect ${PROVIDER_LABEL[provider]}?`)) return;
		setBusy("delete");
		try {
			await del({ data: { provider } });
			window.alert(`${PROVIDER_LABEL[provider]} disconnected`);
			onChanged();
		} catch (err) {
			window.alert(err instanceof Error ? err.message : "Delete failed");
		} finally {
			setBusy(null);
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
				<Button onClick={handleSave} disabled={busy !== null} size="sm">
					<Save className="mr-1.5 h-3.5 w-3.5" />
					{account ? "Update" : "Connect"}
				</Button>
				<Button
					onClick={handleSync}
					disabled={busy !== null || !account}
					size="sm"
					variant="outline"
				>
					<RefreshCw
						className={`mr-1.5 h-3.5 w-3.5 ${busy === "sync" ? "animate-spin" : ""}`}
					/>
					Sync now
				</Button>
				{account && (
					<Button
						onClick={handleDelete}
						disabled={busy !== null}
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
