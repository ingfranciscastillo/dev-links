import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import {
	ArrowUpRight,
	Code2,
	Eye,
	FileText,
	Folder,
	Link as LinkIcon,
	MousePointerClick,
	Share2,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
	useAnalyticsSummary,
	useProfileData,
} from "@/lib/queries/profile-data";

export const Route = createFileRoute("/_authenticated/dashboard")({
	head: () => ({ meta: [{ title: "Dashboard — DevLinks" }] }),
	component: DashboardHome,
});

function DashboardHome() {
	const { user } = useRouteContext({ from: "/_authenticated" });
	const data = useProfileData();
	const analytics = useAnalyticsSummary(7);

	const activeLinks = data.links.filter((l) => l.active).length;
	const t = analytics.data ?? { views: 0, clicks: 0 };
	const stats = [
		{
			label: "Page views (7d)",
			value: t.views.toLocaleString(),
			delta: "last 7 days",
			icon: Eye,
		},
		{
			label: "Total clicks (7d)",
			value: t.clicks.toLocaleString(),
			delta: "last 7 days",
			icon: MousePointerClick,
		},
		{
			label: "Active links",
			value: `${activeLinks}`,
			delta: `of ${data.links.length}`,
			icon: LinkIcon,
		},
	];

	async function share() {
		const url = `${window.location.origin}/${user.username ?? ""}`;
		try {
			await navigator.clipboard.writeText(url);
			window.alert("Link copied to clipboard");
		} catch {
			window.alert("Couldn't copy");
		}
	}

	return (
		<DashboardShell>
			<div className="mb-8 flex flex-wrap items-end justify-between gap-4">
				<div>
					<p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
						Overview
					</p>
					<h1 className="mt-1 text-3xl font-semibold tracking-tight">
						Welcome back, {user.name.split(" ")[0]}.
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Here's how your DevLinks page is doing this week.
					</p>
				</div>
				<button
					type="button"
					onClick={share}
					className="inline-flex h-9 items-center gap-2 rounded-md bg-foreground px-3.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
				>
					<Share2 className="h-4 w-4" />
					Share my page
				</button>
			</div>

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{stats.map((s) => {
					const Icon = s.icon;
					return (
						<div
							key={s.label}
							className="rounded-xl border border-hairline bg-surface/40 p-5"
						>
							<div className="flex items-center justify-between text-muted-foreground">
								<p className="text-sm">{s.label}</p>
								<Icon className="h-4 w-4" />
							</div>
							<p className="mt-3 text-3xl font-semibold tracking-tight">
								{s.value}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">{s.delta}</p>
						</div>
					);
				})}
			</div>

			<div className="mt-4 grid gap-4 sm:grid-cols-3">
				<MiniStat
					icon={Folder}
					label="Projects"
					value={data.projects.length}
					to="/dashboard/projects"
				/>
				<MiniStat
					icon={Code2}
					label="Snippets"
					value={data.snippets.length}
					to="/dashboard/snippets"
				/>
				<MiniStat
					icon={FileText}
					label="Articles"
					value={data.articles.length}
					to="/dashboard/articles"
				/>
			</div>

			<div className="mt-8 grid gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2 rounded-xl border border-hairline bg-surface/40 p-6">
					<div className="flex items-center justify-between">
						<div>
							<h2 className="text-base font-semibold">Your public page</h2>
							<p className="mt-1 text-sm text-muted-foreground">
								Shared at{" "}
								<span className="font-mono text-xs text-foreground">
									devlinks.com/{user.username}
								</span>
							</p>
						</div>
						<Link
							to="/$username"
							params={{ username: user.username ?? "" }}
							className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface px-3 text-xs font-medium hover:bg-surface-elevated"
						>
							Open <ArrowUpRight className="h-3.5 w-3.5" />
						</Link>
					</div>

					<div className="mt-5 rounded-lg border border-hairline bg-background p-6">
						<div className="flex items-center gap-4">
							<div
								className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold text-background"
								style={{ background: `oklch(0.7 0.18 ${hueFor(user.id)})` }}
							>
								{user.name.slice(0, 1).toUpperCase()}
							</div>
							<div className="min-w-0">
								<p className="truncate text-base font-semibold">{user.name}</p>
								<p className="truncate text-sm text-muted-foreground">
									@{user.username}
								</p>
							</div>
						</div>
						<p className="mt-4 text-sm text-muted-foreground">
							{(user as { bio?: string }).bio ??
								"Add a short bio in your profile to help visitors know what you build."}
						</p>
					</div>
				</div>

				<div className="rounded-xl border border-hairline bg-surface/40 p-6">
					<h2 className="text-base font-semibold">Setup checklist</h2>
					<ul className="mt-4 space-y-3 text-sm">
						{[
							["Create your account", true],
							["Add a bio and avatar", false],
							["Connect GitHub", false],
							["Add your first link", false],
							["Share your page", false],
						].map(([label, done]) => (
							<li key={label as string} className="flex items-center gap-2.5">
								<span
									className={
										"inline-flex h-4 w-4 items-center justify-center rounded-full border " +
										(done
											? "border-foreground bg-foreground text-background"
											: "border-hairline text-transparent")
									}
								>
									✓
								</span>
								<span
									className={done ? "text-muted-foreground line-through" : ""}
								>
									{label}
								</span>
							</li>
						))}
					</ul>
				</div>
			</div>
		</DashboardShell>
	);
}

function hueFor(id: string): number {
	let h = 0;
	for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
	return h % 360;
}

function MiniStat({
	icon: Icon,
	label,
	value,
	to,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: number;
	to: string;
}) {
	return (
		<Link
			to={to}
			className="flex items-center justify-between rounded-xl border border-hairline bg-surface/40 p-4 transition-colors hover:bg-surface-elevated"
		>
			<div className="flex items-center gap-2.5 text-sm text-muted-foreground">
				<Icon className="h-4 w-4" />
				{label}
			</div>
			<span className="font-mono text-sm font-medium">{value}</span>
		</Link>
	);
}
