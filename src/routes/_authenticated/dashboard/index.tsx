import {
	ArrowRightUpIcon,
	CodeSquareIcon,
	CursorIcon,
	EyeIcon,
	FolderIcon,
	LinkIcon,
	NotesIcon,
	ShareIcon,
} from "@solar-icons/react/linear";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAnalyticsSummary } from "@/lib/queries/analytics";
import { useIntegrationAccounts } from "@/lib/queries/integrations";
import { useProfileCore, useProfileData } from "@/lib/queries/profile-data";

function sharedStorageKey(userId: string) {
	return `devlinks:shared:${userId}`;
}

export const Route = createFileRoute("/_authenticated/dashboard/")({
	head: () => ({ meta: [{ title: "Dashboard — DevLinks" }] }),
	component: DashboardHome,
});

function DashboardHome() {
	const { user } = useRouteContext({ from: "/_authenticated" });
	const data = useProfileData();
	const core = useProfileCore();
	const analytics = useAnalyticsSummary(7);
	const integrations = useIntegrationAccounts();

	const [hasShared, setHasShared] = useState(false);

	useEffect(() => {
		try {
			setHasShared(localStorage.getItem(sharedStorageKey(user.id)) === "1");
		} catch {
			// Private browsing / storage disabled — checklist item just stays open.
		}
	}, [user.id]);

	const activeLinks = data.links.filter((link) => link.active).length;
	const totals = analytics.data ?? { views: 0, clicks: 0 };

	const checklist: Array<[string, boolean]> = [
		["Create your account", true],
		["Add a bio and avatar", Boolean(core.data?.bio) && Boolean(user.image)],
		[
			"Connect GitHub",
			integrations.data?.some((a) => a.provider === "github") ?? false,
		],
		["Add your first link", data.links.length > 0],
		["Share your page", hasShared],
	];

	const stats = [
		{
			label: "Page views",
			value: totals.views.toLocaleString(),
			meta: "Last 7 days",
			icon: EyeIcon,
		},
		{
			label: "Total clicks",
			value: totals.clicks.toLocaleString(),
			meta: "Last 7 days",
			icon: CursorIcon,
		},
		{
			label: "Active links",
			value: activeLinks.toString(),
			meta: `of ${data.links.length}`,
			icon: LinkIcon,
		},
	];

	async function share() {
		const url = `${window.location.origin}/${user.username ?? ""}`;

		try {
			await navigator.clipboard.writeText(url);
			toast.success("Link copied to clipboard");
			try {
				localStorage.setItem(sharedStorageKey(user.id), "1");
			} catch {
				// Private browsing / storage disabled — non-critical, skip.
			}
			setHasShared(true);
		} catch {
			toast.error("Couldn't copy");
		}
	}

	return (
		<div className="mx-auto w-full max-w-6xl">
			<header className="flex flex-col gap-8 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
						01 / Overview
					</p>

					<h1 className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
						Welcome back, {user.name.split(" ")[0]}.
					</h1>

					<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
						Here&apos;s how your DevLinks page is doing this week.
					</p>
				</div>

				<button
					type="button"
					onClick={share}
					className="group inline-flex w-fit items-center gap-2 border border-foreground px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
				>
					<ShareIcon className="h-3.5 w-3.5" />
					Share my page
				</button>
			</header>

			<section className="border-b border-border" aria-label="Analytics">
				<div className="grid sm:grid-cols-3">
					{stats.map((stat, index) => {
						const Icon = stat.icon;

						return (
							<div
								key={stat.label}
								className={`py-7 sm:px-6 ${
									index > 0
										? "border-t border-border sm:border-l sm:border-t-0"
										: ""
								}`}
							>
								<div className="flex items-center gap-2 text-muted-foreground">
									<Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
									<p className="font-mono text-[9px] uppercase tracking-widest">
										{stat.label}
									</p>
								</div>

								<p className="mt-4 font-display text-4xl tracking-[-0.03em]">
									{stat.value}
								</p>

								<p className="mt-1 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
									{stat.meta}
								</p>
							</div>
						);
					})}
				</div>
			</section>

			<section className="border-b border-border py-8">
				<div className="grid sm:grid-cols-3">
					<MiniStat
						icon={FolderIcon}
						label="Projects"
						value={data.projects.length}
						to="/dashboard/projects"
					/>

					<MiniStat
						icon={CodeSquareIcon}
						label="Snippets"
						value={data.snippets.length}
						to="/dashboard/snippets"
					/>

					<MiniStat
						icon={NotesIcon}
						label="Articles"
						value={data.articles.length}
						to="/dashboard/articles"
					/>
				</div>
			</section>

			<div className="grid gap-0 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.7fr)]">
				<section className="border-b border-border py-8 lg:border-b-0 lg:border-r lg:pr-10">
					<div className="flex items-start justify-between gap-6">
						<div>
							<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
								02 / Public page
							</p>

							<h2 className="mt-4 font-display text-3xl tracking-[-0.03em]">
								Your public page
							</h2>

							<p className="mt-2 text-sm text-muted-foreground">
								Shared at{" "}
								<span className="font-mono text-[11px] text-foreground">
									devlinks.com/{user.username}
								</span>
							</p>
						</div>

						<Link
							to="/$username"
							params={{ username: user.username ?? "" }}
							className="group inline-flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-brand"
						>
							Open
							<ArrowRightUpIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
						</Link>
					</div>

					<div className="mt-8 border-t border-border pt-6">
						<div className="flex items-start gap-4">
							<div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden border border-border bg-surface font-display text-xl">
								{user.image ? (
									<img
										src={user.image}
										alt=""
										className="h-full w-full object-cover"
									/>
								) : (
									user.name.slice(0, 1).toUpperCase()
								)}
							</div>

							<div className="min-w-0">
								<p className="font-display text-2xl tracking-tight">
									{user.name}
								</p>

								<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
									@{user.username}
								</p>
							</div>
						</div>

						<p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							{core.data?.bio ||
								"Add a short bio in your profile to help visitors know what you build."}
						</p>
					</div>
				</section>

				<section className="py-8 lg:pl-10">
					<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
						03 / Setup
					</p>

					<h2 className="mt-4 font-display text-3xl tracking-[-0.03em]">
						Setup checklist
					</h2>

					<ul className="mt-6 border-t border-border">
						{checklist.map(([label, done], index) => (
							<li
								key={label}
								className="flex items-center gap-3 border-b border-border py-4"
							>
								<span
									className={`font-mono text-[9px] transition-colors duration-300 ${
										done ? "text-brand" : "text-muted-foreground"
									}`}
								>
									{String(index + 1).padStart(2, "0")}
								</span>

								<span
									className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
										done ? "bg-brand" : "border border-border"
									}`}
								/>

								<span
									className={`text-sm transition-colors duration-300 ${
										done
											? "text-muted-foreground line-through"
											: "text-foreground"
									}`}
								>
									{label}
								</span>
							</li>
						))}
					</ul>
				</section>
			</div>
		</div>
	);
}

function MiniStat({
	icon: Icon,
	label,
	value,
	to,
}: {
	icon: React.ComponentType<{
		className?: string;
		strokeWidth?: number;
	}>;
	label: string;
	value: number;
	to: string;
}) {
	return (
		<Link
			to={to}
			className="group flex items-center justify-between border-b border-border py-5 transition-colors hover:text-brand sm:border-b-0 sm:px-6 first:sm:pl-0 last:sm:pr-0"
		>
			<div className="flex items-center gap-3 text-sm text-muted-foreground">
				<Icon className="h-4 w-4" strokeWidth={1.7} />
				<span>{label}</span>
			</div>

			<div className="flex items-center gap-3">
				<span className="font-mono text-sm tabular-nums text-foreground">
					{value}
				</span>

				<span className="font-mono text-xs text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand">
					↗
				</span>
			</div>
		</Link>
	);
}
