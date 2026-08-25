import {
	Link,
	useNavigate,
	useRouteContext,
	useRouter,
} from "@tanstack/react-router";
import {
	BarChart3,
	Code2,
	FileText,
	Folder,
	Home,
	Link as LinkIcon,
	LogOut,
	Palette,
	Plug,
	Settings,
	Sparkles,
	User,
} from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { authClient } from "@/lib/auth-client";
import { hueFromString } from "@/lib/user";

type NavItem = { label: string; to: string; icon: typeof Home; end?: boolean };
const nav: NavItem[] = [
	{ label: "Overview", to: "/dashboard", icon: Home, end: true },
	{ label: "Profile", to: "/dashboard/profile", icon: User },
	{ label: "Links", to: "/dashboard/links", icon: LinkIcon },
	{ label: "Projects", to: "/dashboard/projects", icon: Folder },
	{ label: "Snippets", to: "/dashboard/snippets", icon: Code2 },
	{ label: "Articles", to: "/dashboard/articles", icon: FileText },
	{ label: "Integrations", to: "/dashboard/integrations", icon: Plug },
	{ label: "Theme", to: "/dashboard/theme", icon: Palette },
	{ label: "Analytics", to: "/dashboard/analytics", icon: BarChart3 },
	{ label: "Settings", to: "/dashboard/settings", icon: Settings },
];

export function DashboardShell({ children }: { children: ReactNode }) {
	// El user ya viene garantizado (no-null) desde el beforeLoad de /_authenticated
	const { user } = useRouteContext({ from: "/_authenticated" });
	const navigate = useNavigate();
	const router = useRouter();
	const pathname = router.state.location.pathname;

	async function handleSignOut() {
		await authClient.signOut();
		await router.invalidate();
		navigate({ to: "/" });
	}

	const avatarHue = hueFromString(user.id);

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<div className="mx-auto flex max-w-7xl">
				<aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-hairline bg-surface/40 px-3 py-5 md:flex">
					<Link
						to="/"
						className="mb-6 flex items-center gap-2 px-2 font-semibold tracking-tight"
					>
						<span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-foreground text-background">
							<Sparkles className="h-3.5 w-3.5" />
						</span>
						DevLinks
					</Link>

					<nav className="flex-1 space-y-0.5">
						{nav.map((item) => {
							const active = item.end
								? pathname === item.to
								: pathname.startsWith(item.to);
							const Icon = item.icon;
							const className =
								"flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors " +
								(active
									? "bg-surface-elevated text-foreground"
									: "text-muted-foreground hover:bg-surface-elevated hover:text-foreground");
							return (
								<Link key={item.to} to={item.to} className={className}>
									<Icon className="h-4 w-4" />
									{item.label}
								</Link>
							);
						})}
					</nav>

					<div className="mt-4 rounded-lg border border-hairline bg-background/40 p-3">
						<p className="text-xs font-medium">Free plan</p>
						<p className="mt-1 text-xs text-muted-foreground">
							10 links · 5 projects · 5 snippets
						</p>
						<Link
							to="/dashboard"
							className="mt-2 inline-flex h-7 items-center justify-center rounded-md bg-foreground px-2.5 text-xs font-medium text-background"
						>
							Upgrade to Pro
						</Link>
					</div>
				</aside>

				<div className="flex min-w-0 flex-1 flex-col">
					<header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-hairline bg-background/80 px-4 backdrop-blur sm:px-6">
						<div className="flex items-center gap-3 text-sm">
							<span className="hidden text-muted-foreground sm:inline">
								devlinks.com/
							</span>
							<Link
								to="/$username"
								params={{ username: user.username ?? "" }}
								className="font-medium hover:underline"
							>
								{user.username}
							</Link>
						</div>

						<div className="flex items-center gap-2">
							<Link
								to="/$username"
								params={{ username: user.username ?? "" }}
								className="hidden h-8 items-center rounded-md border border-border bg-surface px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground sm:inline-flex"
							>
								View public page
							</Link>
							<ThemeToggle />
							<button
								type="button"
								onClick={handleSignOut}
								title="Sign out"
								className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
							>
								<LogOut className="h-4 w-4" />
							</button>
							<div
								className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-background"
								style={{ background: `oklch(0.7 0.18 ${avatarHue})` }}
							>
								{user.name.slice(0, 1).toUpperCase()}
							</div>
						</div>
					</header>

					<main className="flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
				</div>
			</div>
		</div>
	);
}

export function EmptyState({
	icon: Icon,
	title,
	description,
}: {
	icon: typeof Home;
	title: string;
	description: string;
}) {
	return (
		<div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline bg-surface/40 py-16 text-center">
			<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface-elevated text-muted-foreground">
				<Icon className="h-5 w-5" />
			</div>
			<h3 className="text-base font-semibold">{title}</h3>
			<p className="mt-1 max-w-sm text-sm text-muted-foreground">
				{description}
			</p>
			<button
				type="button"
				disabled
				className="mt-4 inline-flex h-8 items-center rounded-md border border-border bg-surface px-3 text-xs font-medium text-muted-foreground opacity-70"
			>
				Coming soon
			</button>
		</div>
	);
}
