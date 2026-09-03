import {
	Chart2Icon,
	CodeSquareIcon,
	FolderWithFilesIcon,
	HamburgerMenuIcon,
	HeartIcon,
	Home2Icon,
	LinkIcon,
	Logout2Icon,
	MicrophoneIcon,
	NotesIcon,
	PaletteIcon,
	PlugCircleIcon,
	SettingsIcon,
	UserIcon,
} from "@solar-icons/react/linear";
import {
	Link,
	useNavigate,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import { X } from "lucide-react";
import {
	type ComponentType,
	type CSSProperties,
	type ReactNode,
	type SVGProps,
	useEffect,
	useState,
} from "react";
import toast from "react-hot-toast";

import { ThemeToggle } from "@/components/site/ThemeToggle";
import { authClient } from "@/lib/auth-client";
import { startProCheckout } from "@/lib/billing";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { useProfileCore } from "@/lib/queries/profile-data";
import { cn } from "@/lib/utils";

type NavIcon = ComponentType<SVGProps<SVGSVGElement>>;

type NavItem = {
	label: string;
	to: string;
	icon: NavIcon;
	end?: boolean;
};

const nav: NavItem[] = [
	{ label: "Overview", to: "/dashboard", icon: Home2Icon, end: true },
	{ label: "Profile", to: "/dashboard/profile", icon: UserIcon },
	{ label: "Links", to: "/dashboard/links", icon: LinkIcon },
	{
		label: "Projects",
		to: "/dashboard/projects",
		icon: FolderWithFilesIcon,
	},
	{
		label: "Snippets",
		to: "/dashboard/snippets",
		icon: CodeSquareIcon,
	},
	{ label: "Articles", to: "/dashboard/articles", icon: NotesIcon },
	{
		label: "Integrations",
		to: "/dashboard/integrations",
		icon: PlugCircleIcon,
	},
	{ label: "Theme", to: "/dashboard/theme", icon: PaletteIcon },
	{
		label: "Analytics",
		to: "/dashboard/analytics",
		icon: Chart2Icon,
	},
	{
		label: "Support",
		to: "/dashboard/support",
		icon: HeartIcon,
	},
	{
		label: "Talks",
		to: "/dashboard/talks",
		icon: MicrophoneIcon,
	},
	{
		label: "Settings",
		to: "/dashboard/settings",
		icon: SettingsIcon,
	},
];

export function DashboardShell({ children }: { children: ReactNode }) {
	const { user } = useRouteContext({ from: "/_authenticated" });
	const navigate = useNavigate();
	const router = useRouter();
	const pathname = router.state.location.pathname;
	const core = useProfileCore();
	const isPro = core.data?.plan === "pro";
	const [mobileNavOpen, setMobileNavOpen] = useState(false);

	async function handleSignOut() {
		await authClient.signOut();
		await router.invalidate();
		await navigate({ to: "/" });
	}

	async function handleUpgrade() {
		try {
			await startProCheckout();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Couldn't start checkout",
			);
		}
	}

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<div className="mx-auto flex min-h-dvh max-w-360">
				<aside
					className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-border bg-background md:flex"
					// La sidebar no cambia entre subpáginas del dashboard — sin
					// nombre propio, la view transition del router la incluiría
					// en el crossfade de "root" y animaría píxeles idénticos.
					style={{ viewTransitionName: "dashboard-sidebar" } as CSSProperties}
				>
					<div className="flex h-16 items-center border-b border-border px-6">
						<Link to="/" className="flex items-center gap-2.5">
							<span className="font-display text-xl leading-none tracking-[-0.03em]">
								DevLinks
							</span>

							<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
								01
							</span>
						</Link>
					</div>

					<div className="flex flex-1 flex-col px-4 py-5">
						<WorkspaceNav
							pathname={pathname}
							isPro={isPro}
							onUpgrade={handleUpgrade}
						/>
					</div>
				</aside>

				{mobileNavOpen && (
					<MobileNavDrawer onClose={() => setMobileNavOpen(false)}>
						{(requestClose) => (
							<>
								<div className="flex h-16 items-center justify-between border-b border-border px-6">
									<Link
										to="/"
										className="flex items-center gap-2.5"
										onClick={requestClose}
									>
										<span className="font-display text-xl leading-none tracking-[-0.03em]">
											DevLinks
										</span>

										<span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
											01
										</span>
									</Link>

									<button
										type="button"
										onClick={requestClose}
										aria-label="Close menu"
										className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
									>
										<X className="h-4 w-4" strokeWidth={1.5} />
									</button>
								</div>

								<div className="flex flex-1 flex-col overflow-y-auto px-4 py-5">
									<WorkspaceNav
										pathname={pathname}
										isPro={isPro}
										onUpgrade={() => {
											requestClose();
											handleUpgrade();
										}}
										onNavigate={requestClose}
									/>
								</div>
							</>
						)}
					</MobileNavDrawer>
				)}

				<div className="flex min-w-0 flex-1 flex-col">
					<header
						className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/95 px-5 backdrop-blur-sm sm:px-8"
						style={{ viewTransitionName: "dashboard-header" } as CSSProperties}
					>
						<div className="flex min-w-0 items-center gap-3">
							<button
								type="button"
								onClick={() => setMobileNavOpen(true)}
								aria-label="Open menu"
								className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors hover:text-foreground md:hidden"
							>
								<HamburgerMenuIcon className="h-5 w-5" strokeWidth={1.7} />
							</button>

							<Link
								to="/$username"
								params={{ username: user.username ?? "" }}
								className="group flex min-w-0 items-center gap-2"
							>
								<span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
									devlinks.com/
								</span>

								<span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-foreground transition-colors group-hover:text-brand">
									{user.username}
								</span>
							</Link>
						</div>

						<div className="flex items-center gap-3">
							<Link
								to="/$username"
								params={{ username: user.username ?? "" }}
								className="hidden border border-border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:border-foreground hover:text-foreground sm:inline-flex"
							>
								View public page
							</Link>

							<ThemeToggle />

							<button
								type="button"
								onClick={handleSignOut}
								title="Sign out"
								aria-label="Sign out"
								className="inline-flex h-8 w-8 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
							>
								<Logout2Icon className="h-4 w-4" strokeWidth={1.7} />
							</button>

							<div className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-border bg-surface font-display text-sm text-foreground">
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
						</div>
					</header>

					<main className="flex-1 px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
						{children}
					</main>
				</div>
			</div>
		</div>
	);
}

function WorkspaceNav({
	pathname,
	isPro,
	onUpgrade,
	onNavigate,
}: {
	pathname: string;
	isPro: boolean;
	onUpgrade: () => void;
	onNavigate?: () => void;
}) {
	return (
		<>
			<p className="px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-brand">
				Workspace
			</p>

			<nav className="mt-4 space-y-0.5">
				{nav.map((item) => {
					const active = item.end
						? pathname === item.to
						: pathname.startsWith(item.to);

					const Icon = item.icon;

					return (
						<Link
							key={item.to}
							to={item.to}
							onClick={onNavigate}
							className={`group relative flex items-center gap-3 px-2 py-2.5 text-sm transition-colors ${
								active
									? "text-foreground"
									: "text-muted-foreground hover:text-foreground"
							}`}
						>
							<span
								className={`absolute -left-4 top-0 h-full w-px transition-colors ${
									active ? "bg-brand" : "bg-transparent"
								}`}
							/>

							<Icon
								className={`h-4 w-4 transition-colors ${
									active
										? "text-brand"
										: "text-muted-foreground group-hover:text-foreground"
								}`}
								strokeWidth={1.7}
							/>

							<span>{item.label}</span>
						</Link>
					);
				})}
			</nav>

			<div className="mt-auto border-t border-border pt-5">
				<div className="flex items-start justify-between gap-4">
					<div>
						<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
							Current plan
						</p>

						<p className="mt-2 font-display text-2xl tracking-[-0.02em]">
							{isPro ? "Pro" : "Free"}
						</p>

						<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
							{isPro
								? "Unlimited links · projects · snippets"
								: `${PLAN_LIMITS.free.links} links · ${PLAN_LIMITS.free.projects} projects · ${PLAN_LIMITS.free.snippets} snippets`}
						</p>
					</div>

					{!isPro && (
						<button
							type="button"
							onClick={onUpgrade}
							className="font-mono text-[9px] uppercase tracking-[0.08em] text-brand transition-colors hover:text-foreground"
						>
							Upgrade
						</button>
					)}
				</div>
			</div>
		</>
	);
}

const DRAWER_EXIT_MS = 200;

function MobileNavDrawer({
	onClose,
	children,
}: {
	onClose: () => void;
	children: (requestClose: () => void) => ReactNode;
}) {
	const [closing, setClosing] = useState(false);

	function requestClose() {
		setClosing(true);
	}

	useEffect(() => {
		if (!closing) return;
		const timer = setTimeout(onClose, DRAWER_EXIT_MS);
		return () => clearTimeout(timer);
	}, [closing, onClose]);

	return (
		<div className="fixed inset-0 z-50 md:hidden" role="presentation">
			<button
				type="button"
				className={cn(
					"absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-200 motion-reduce:transition-none",
					closing ? "opacity-0" : "opacity-100",
				)}
				onClick={requestClose}
				aria-label="Close menu"
			/>

			<div
				className={cn(
					"relative z-10 flex h-dvh w-72 max-w-[85vw] flex-col border-r border-border bg-background transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] starting:-translate-x-full motion-reduce:transition-none",
					closing ? "-translate-x-full" : "translate-x-0",
				)}
				role="dialog"
				aria-modal="true"
				aria-label="Dashboard navigation"
			>
				{children(requestClose)}
			</div>
		</div>
	);
}

export function EmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: NavIcon;
	title: string;
	description: string;
}) {
	return (
		<div className="border-t border-b border-border py-16 text-center">
			<div className="mx-auto flex h-10 w-10 items-center justify-center text-muted-foreground">
				<Icon className="h-5 w-5" strokeWidth={1.5} />
			</div>

			<h3 className="mt-5 font-display text-2xl tracking-[-0.02em]">{title}</h3>

			<p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
				{description}
			</p>

			<button
				type="button"
				disabled
				className="mt-5 border border-border px-4 py-2 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground opacity-70"
			>
				Coming soon
			</button>
		</div>
	);
}
