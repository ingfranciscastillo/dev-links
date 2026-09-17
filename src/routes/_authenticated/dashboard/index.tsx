import {
	ArrowRightUpIcon,
	CodeSquareIcon,
	CursorIcon,
	EyeIcon,
	FolderIcon,
	LinkMinimalistic2Icon,
	NotesIcon,
	ShareIcon,
	UnreadIcon,
} from "@solar-icons/react/linear";
import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import posthog from "posthog-js";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AnimatedNumber } from "@/components/motion/AnimatedNumber";
import { PageTitle } from "@/components/motion/PageTitle";
import { useAnalyticsSummary } from "@/lib/queries/analytics";
import { useIntegrationAccounts } from "@/lib/queries/integrations";
import { useProfileCore, useProfileData } from "@/lib/queries/profile-data";

function sharedStorageKey(userId: string) {
	return `devlinks:shared:${userId}`;
}

function bioLinkedStorageKey(userId: string) {
	return `devlinks:bio-linked:${userId}`;
}

function checklistDismissedStorageKey(userId: string) {
	return `devlinks:checklist-dismissed:${userId}`;
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
	const reduceMotion = useReducedMotion();

	const [hasShared, setHasShared] = useState(false);
	const [hasLinkedBio, setHasLinkedBio] = useState(false);
	const [checklistDismissed, setChecklistDismissed] = useState(false);
	const [justShared, setJustShared] = useState(false);

	useEffect(() => {
		try {
			setHasShared(localStorage.getItem(sharedStorageKey(user.id)) === "1");
			setHasLinkedBio(
				localStorage.getItem(bioLinkedStorageKey(user.id)) === "1",
			);
			setChecklistDismissed(
				localStorage.getItem(checklistDismissedStorageKey(user.id)) === "1",
			);
		} catch {
			// Private browsing / storage disabled — checklist item just stays open.
		}
	}, [user.id]);

	// Dodo redirige acá después de un checkout exitoso (ver successUrl en
	// auth.ts) — el plan real lo setea el webhook, esto es solo la
	// confirmación visual de que el pago se completó.
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("upgraded") !== "1") return;

		toast.success("Welcome to Pro — everything's unlocked.");
		posthog.capture("upgrade_completed", { plan: "pro" });
		window.history.replaceState(null, "", window.location.pathname);
	}, []);

	const activeLinks = data.links.filter((link) => link.active).length;
	const totals = analytics.data ?? { views: 0, clicks: 0 };

	const checklist: Array<{
		label: string;
		done: boolean;
		to?: string;
		action?: () => void;
	}> = [
		{ label: "Create your account", done: true },
		{
			// Primero — es el diferenciador real del producto (sync automático),
			// no bio/avatar. Antes iba tercero y hacía que alguien pudiera
			// "completar" el setup sin haber tocado la parte que de verdad
			// importa.
			label: "Connect GitHub",
			done: integrations.data?.some((a) => a.provider === "github") ?? false,
			to: "/dashboard/integrations",
		},
		{
			label: "Add a bio and avatar",
			done: Boolean(core.data?.bio) && Boolean(user.image),
			to: "/dashboard/profile",
		},
		{
			label: "Add your first link",
			done: data.links.length > 0,
			to: "/dashboard/links",
		},
		{ label: "Share your page", done: hasShared, action: share },
		// Exposure loop: every place this link lives is a passive ad — the
		// GitHub bio specifically because it's already the profile devs check
		// each other's work through. Self-reported (like "Share your page"),
		// no way to verify without re-scraping their GitHub profile.
		{
			label: "Add your link to your GitHub bio",
			done: hasLinkedBio,
			action: addLinkToGithubBio,
		},
	];

	const allDone = checklist.every((item) => item.done);

	function dismissChecklist() {
		setChecklistDismissed(true);
		try {
			localStorage.setItem(checklistDismissedStorageKey(user.id), "1");
		} catch {
			// Private browsing / storage disabled — non-critical, skip.
		}
		posthog.capture("checklist_dismissed");
	}

	const stats = [
		{
			label: "Page views",
			value: totals.views,
			meta: "Last 7 days",
			icon: EyeIcon,
			loading: analytics.isLoading,
		},
		{
			label: "Total clicks",
			value: totals.clicks,
			meta: "Last 7 days",
			icon: CursorIcon,
			loading: analytics.isLoading,
		},
		{
			label: "Active links",
			value: activeLinks,
			meta: `of ${data.links.length}`,
			icon: LinkMinimalistic2Icon,
			loading: false,
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
			setJustShared(true);
			setTimeout(() => setJustShared(false), 2000);
			posthog.capture("checklist_item_completed", { item: "share_page" });
		} catch {
			toast.error("Couldn't copy");
		}
	}

	async function addLinkToGithubBio() {
		const url = `${window.location.origin}/${user.username ?? ""}`;

		try {
			await navigator.clipboard.writeText(url);
			toast.success("Link copied — paste it into your GitHub bio");
		} catch {
			toast.error("Couldn't copy");
		}

		window.open("https://github.com/settings/profile", "_blank", "noopener");

		try {
			localStorage.setItem(bioLinkedStorageKey(user.id), "1");
		} catch {
			// Private browsing / storage disabled — non-critical, skip.
		}
		setHasLinkedBio(true);
		posthog.capture("checklist_item_completed", { item: "add_link_to_bio" });
	}

	return (
		<div className="mx-auto w-full max-w-6xl">
			<header className="flex flex-col gap-8 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
						01 / Overview
					</p>

					<PageTitle className="mt-5 font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
						Welcome back, {user.name.split(" ")[0]}.
					</PageTitle>

					<p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
						Here&apos;s how your DevLinks page is doing this week.
					</p>
				</div>

				<button
					type="button"
					onClick={share}
					className={`group inline-flex w-fit items-center gap-2 border px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.08em] transition-[color,border-color,transform] active:scale-[0.97] ${
						justShared
							? "border-brand text-brand"
							: "border-foreground text-foreground hover:border-brand hover:text-brand"
					}`}
				>
					<AnimatePresence mode="wait" initial={false}>
						<motion.span
							key={justShared ? "copied" : "share"}
							initial={reduceMotion ? false : { opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 4 }}
							transition={{ duration: 0.15 }}
							className="inline-flex items-center gap-2"
						>
							{justShared ? (
								<UnreadIcon size={15} />
							) : (
								<ShareIcon className="h-3.5 w-3.5" strokeWidth={1} />
							)}
							{justShared ? "Copied" : "Share my page"}
						</motion.span>
					</AnimatePresence>
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
									<Icon className="size-3.5" strokeWidth={1.7} />
									<p className="font-mono text-[9px] uppercase tracking-widest">
										{stat.label}
									</p>
								</div>

								{stat.loading ? (
									<div className="mt-4 h-9 w-16 animate-pulse bg-surface" />
								) : (
									<p className="mt-4 font-display text-4xl tracking-[-0.03em] tabular-nums">
										<AnimatedNumber value={stat.value} />
									</p>
								)}

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

				{!checklistDismissed && (
					<section className="py-8 lg:pl-10">
						<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
							03 / Setup
						</p>

						<h2 className="mt-4 font-display text-3xl tracking-[-0.03em]">
							Setup checklist
						</h2>

						{allDone && (
							<div className="mt-4 flex items-center justify-between gap-4">
								<p className="flex items-center gap-2 text-sm text-muted-foreground">
									<UnreadIcon size={18} className="shrink-0 text-brand" />
									All set — your page is live and up to date.
								</p>

								<button
									type="button"
									onClick={dismissChecklist}
									className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
								>
									Hide
								</button>
							</div>
						)}

						<ul className="mt-6 border-t border-border">
							{checklist.map(({ label, done, to, action }, index) => (
								<motion.li
									key={label}
									initial={reduceMotion ? false : { opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{
										duration: reduceMotion ? 0.01 : 0.3,
										delay: reduceMotion ? 0 : index * 0.04,
										ease: [0.16, 1, 0.3, 1],
									}}
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
										className={`flex-1 text-sm transition-colors duration-300 ${
											done
												? "text-muted-foreground line-through"
												: "text-foreground"
										}`}
									>
										{label}
									</span>

									{!done && to && (
										<Link
											to={to}
											className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-brand transition-colors hover:text-foreground"
										>
											Do it →
										</Link>
									)}

									{!done && action && (
										<button
											type="button"
											onClick={action}
											className="shrink-0 font-mono text-[9px] uppercase tracking-widest text-brand transition-colors hover:text-foreground"
										>
											Do it →
										</button>
									)}
								</motion.li>
							))}
						</ul>
					</section>
				)}
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
			className="group flex items-center justify-between border-b border-border py-5 transition-colors hover:bg-surface/60 hover:text-brand sm:border-b-0 sm:px-6 first:sm:pl-0 last:sm:pr-0"
		>
			<div className="flex items-center gap-3 text-sm text-muted-foreground">
				<Icon className="size-5" strokeWidth={1.7} />
				<span>{label}</span>
			</div>

			<div className="flex items-center gap-3">
				<span className="font-mono text-sm tabular-nums text-foreground">
					<AnimatedNumber value={value} duration={0.5} />
				</span>

				<span className="font-mono text-xs text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-brand">
					↗
				</span>
			</div>
		</Link>
	);
}
