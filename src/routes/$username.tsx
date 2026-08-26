import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
	Activity,
	ArrowUpRight,
	Code2,
	Globe,
	Link as LinkIcon,
	MapPin,
	MessageSquare,
	Share2,
} from "lucide-react";
import { useEffect } from "react";
import { DevtoBlock } from "@/components/profile/DevtoBlock";
import { GithubBlock } from "@/components/profile/GithubBlock";
import { HashnodeBlock } from "@/components/profile/HashnodeBlock";
import { MediumBlock } from "@/components/profile/MediumBlock";
import { StackOverflowBlock } from "@/components/profile/StackOverflowBlock";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { trackClick, trackView } from "@/lib/analytics-track";
import {
	getPublicProfile,
	type PublicIntegration,
	type PublicProfile,
} from "@/lib/api/public-profile.functions";
import { iconForUrl } from "@/lib/icons";
import type {
	DevtoPayload,
	GithubPayload,
	HashnodePayload,
	MediumPayload,
	StackOverflowPayload,
} from "@/lib/integrations/types";
import type { ProfileData } from "@/lib/schemas";
import { themeToStyleTag } from "@/lib/theme-config";
import { hueFromString } from "@/lib/user";

type LoaderData = {
	live: NonNullable<PublicProfile>;
	username: string;
};

export const Route = createFileRoute("/$username")({
	loader: async ({ params }): Promise<LoaderData> => {
		const username = params.username.toLowerCase();
		const live = await getPublicProfile({ data: { username } });
		if (!live) throw notFound();
		return { live, username };
	},
	head: ({ params, loaderData }) => {
		const l = loaderData?.live;
		const name = l?.name ?? params.username;
		const desc = l?.bio ?? `${name} on DevLinks`;
		return {
			meta: [
				{ title: `${name} (@${params.username}) — DevLinks` },
				{ name: "description", content: desc },
				{ property: "og:title", content: `${name} on DevLinks` },
				{ property: "og:description", content: desc },
				{ property: "og:type", content: "profile" },
				{ name: "twitter:title", content: `${name} on DevLinks` },
				{ name: "twitter:description", content: desc },
			],
			links: [{ rel: "canonical", href: `/${params.username}` }],
		};
	},
	notFoundComponent: NotFoundBlock,
	errorComponent: ({ reset }) => (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4 text-center">
			<div>
				<h1 className="text-xl font-semibold">Couldn't load this profile</h1>
				<button
					type="button"
					onClick={reset}
					className="mt-4 rounded-md border border-border px-4 py-2 text-sm"
				>
					Retry
				</button>
			</div>
		</div>
	),
	component: ProfilePage,
});

function NotFoundBlock() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4">
			<div className="text-center">
				<p className="font-mono text-xs uppercase tracking-widest text-brand">
					404
				</p>
				<h1 className="mt-3 text-3xl font-semibold tracking-tight">
					This profile doesn't exist… yet.
				</h1>
				<p className="mt-2 text-muted-foreground">
					Want this handle? Claim it on the homepage.
				</p>
				<Link
					to="/"
					className="mt-6 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
				>
					Go home
				</Link>
			</div>
		</div>
	);
}

function ProfilePage() {
	const { live, username } = Route.useLoaderData();
	const theme = live.data.theme;
	const avatarHue = hueFromString(live.id);

	useEffect(() => {
		trackView(username, `/${username}`);
	}, [username]);

	const styleTag = theme ? themeToStyleTag(theme, ".tt-scope") : "";

	return (
		<div className="tt-scope min-h-dvh overflow-x-hidden bg-background text-foreground">
			{theme && (
				/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme styles are scoped to .tt-scope and generated server-side */
				<style dangerouslySetInnerHTML={{ __html: styleTag }} />
			)}
			<ProfileHeader username={live.username} available={live.available} />
			<main className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
				<ProfileSidebar
					name={live.name}
					username={live.username}
					bio={live.bio}
					location={live.location}
					website={live.website}
					available={live.available}
					avatarHue={avatarHue}
				/>
				<div className="space-y-10 min-w-0">
					<LinksSection
						links={live.data.links}
						themed={Boolean(theme)}
						username={username}
					/>
					{live.data.snippets.length > 0 && (
						<SnippetsSection snippets={live.data.snippets} />
					)}
					<ProjectsSection projects={live.data.projects} />
					<ArticlesSection articles={live.data.articles} />
					{live.integrations.length > 0 && (
						<IntegrationBlocks integrations={live.integrations} />
					)}
					<Watermark />
				</div>
			</main>
		</div>
	);
}

function IntegrationBlocks({
	integrations,
}: {
	integrations: PublicIntegration[];
}) {
	const by = (provider: string, kind: string) =>
		integrations.find((i) => i.provider === provider && i.kind === kind)
			?.payload;
	const gh = by("github", "profile") as GithubPayload | undefined;
	const dev = by("devto", "articles") as DevtoPayload | undefined;
	const hn = by("hashnode", "posts") as HashnodePayload | undefined;
	const md = by("medium", "posts") as MediumPayload | undefined;
	const so = by("stackoverflow", "profile") as StackOverflowPayload | undefined;
	return (
		<>
			{gh && <GithubBlock payload={gh} />}
			{dev && <DevtoBlock payload={dev} />}
			{hn && <HashnodeBlock payload={hn} />}
			{md && <MediumBlock payload={md} />}
			{so && <StackOverflowBlock payload={so} />}
		</>
	);
}

function SnippetsSection({ snippets }: { snippets: ProfileData["snippets"] }) {
	return (
		<section>
			<SectionTitle icon={Code2} title="Snippets" />
			<div className="grid gap-3">
				{snippets.map((s) => (
					<article
						key={s.id}
						className="overflow-hidden rounded-xl border border-hairline bg-surface"
					>
						<header className="flex items-center justify-between border-b border-hairline px-4 py-2">
							<span className="text-sm font-medium">{s.title}</span>
							<span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
								{s.language}
							</span>
						</header>
						<pre className="overflow-x-auto bg-background/60 p-4 font-mono text-xs leading-relaxed">
							<code>{s.code}</code>
						</pre>
					</article>
				))}
			</div>
		</section>
	);
}

function ProfileHeader({
	username,
	available,
}: {
	username: string;
	available: boolean;
}) {
	return (
		<header className="sticky top-0 z-40 border-b border-hairline glass">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
				<Link
					to="/"
					className="font-mono text-xs text-muted-foreground hover:text-foreground"
				>
					devlinks.com/
					<span className="text-foreground">{username}</span>
				</Link>
				<div className="flex items-center gap-2">
					<button
						type="button"
						aria-label="Share profile"
						className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
					>
						<Share2 className="h-4 w-4" />
					</button>
					{available ? null : <ThemeToggle />}
				</div>
			</div>
		</header>
	);
}

function ProfileSidebar({
	name,
	username,
	bio,
	location,
	website,
	available,
	avatarHue,
}: {
	name: string;
	username: string;
	bio: string;
	location: string;
	website: string;
	available: boolean;
	avatarHue: number;
}) {
	return (
		<aside className="lg:sticky lg:top-20 lg:self-start">
			<div className="pt-10">
				<div
					className="h-24 w-24 rounded-full ring-4 ring-background"
					style={{
						background: `linear-gradient(135deg, oklch(0.7 0.2 ${avatarHue}), oklch(0.4 0.18 ${avatarHue}))`,
					}}
				/>
				<h1 className="mt-4 text-2xl font-semibold tracking-tight">{name}</h1>
				<p className="text-sm text-muted-foreground">@{username}</p>

				{available && (
					<span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
						Available for hire
					</span>
				)}

				{bio && <p className="mt-4 text-sm text-muted-foreground">{bio}</p>}

				<ul className="mt-5 space-y-2 text-sm text-muted-foreground">
					{location && (
						<li className="flex items-center gap-2">
							<MapPin className="h-3.5 w-3.5" /> {location}
						</li>
					)}
					{website && (
						<li className="flex items-center gap-2">
							<Globe className="h-3.5 w-3.5" />
							<a
								href={website}
								className="hover:text-foreground"
								target="_blank"
								rel="noreferrer"
							>
								{website.replace(/^https?:\/\//, "")}
							</a>
						</li>
					)}
				</ul>
			</div>
		</aside>
	);
}

function SectionTitle({
	icon: Icon,
	title,
	hint,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	hint?: string;
}) {
	return (
		<div className="mb-4 flex items-baseline justify-between">
			<h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
				<Icon className="h-3.5 w-3.5" />
				{title}
			</h2>
			{hint && (
				<span className="font-mono text-xs text-muted-foreground">{hint}</span>
			)}
		</div>
	);
}

function LinksSection({
	links,
	themed,
	username,
}: {
	links: ProfileData["links"];
	themed: boolean;
	username: string;
}) {
	if (links.length === 0) return null;
	return (
		<section className="pt-10">
			<SectionTitle icon={LinkIcon} title="Links" />
			<div className="grid gap-2">
				{links.map((l) => {
					const Icon = iconForUrl(l.url);
					return (
						<a
							key={l.id}
							href={l.url}
							target="_blank"
							rel="noreferrer"
							onClick={() =>
								trackClick({
									username,
									linkId: l.id,
									url: l.url,
									title: l.title,
								})
							}
							className={
								themed
									? "tt-btn tt-card"
									: "group flex items-center gap-4 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-elevated"
							}
						>
							<span className="grid h-10 w-10 place-items-center rounded-md border border-hairline bg-background text-lg">
								<Icon className="h-4 w-4" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{l.title}</p>
								{l.description && (
									<p className="truncate text-xs opacity-70">{l.description}</p>
								)}
							</div>
							<ArrowUpRight className="h-4 w-4 opacity-70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
						</a>
					);
				})}
			</div>
		</section>
	);
}

function ProjectsSection({ projects }: { projects: ProfileData["projects"] }) {
	if (projects.length === 0) return null;
	return (
		<section>
			<SectionTitle icon={Activity} title="Projects" />
			<div className="grid gap-3 sm:grid-cols-2">
				{projects.map((p) => (
					<div
						key={p.id}
						className="rounded-xl border border-hairline bg-surface p-4"
					>
						<div className="flex items-center justify-between">
							<p className="font-medium">{p.name}</p>
							<StatusBadge status={p.status} />
						</div>
						<p className="mt-1 text-sm text-muted-foreground">
							{p.description}
						</p>
						<div className="mt-3 flex flex-wrap gap-1.5">
							{p.tech.map((t) => (
								<span
									key={t}
									className="rounded-md bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
								>
									{t}
								</span>
							))}
						</div>
						<div className="mt-3 flex gap-3 text-xs text-muted-foreground">
							{p.github && (
								<a
									href={p.github}
									className="hover:text-foreground"
									target="_blank"
									rel="noreferrer"
								>
									GitHub →
								</a>
							)}
							{p.demo && (
								<a
									href={p.demo}
									className="hover:text-foreground"
									target="_blank"
									rel="noreferrer"
								>
									Live demo →
								</a>
							)}
						</div>
					</div>
				))}
			</div>
		</section>
	);
}

function StatusBadge({ status }: { status: "shipped" | "wip" | "archived" }) {
	const map = {
		shipped: {
			label: "Shipped",
			className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
		},
		wip: {
			label: "WIP",
			className: "border-amber-500/30 bg-amber-500/10 text-amber-500",
		},
		archived: {
			label: "Archived",
			className: "border-muted-foreground/20 bg-muted text-muted-foreground",
		},
	} as const;
	const s = map[status];
	return (
		<span
			className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${s.className}`}
		>
			{s.label}
		</span>
	);
}

function ArticlesSection({ articles }: { articles: ProfileData["articles"] }) {
	if (articles.length === 0) return null;
	return (
		<section>
			<SectionTitle icon={MessageSquare} title="Writing" />
			<div className="divide-y divide-hairline overflow-hidden rounded-xl border border-hairline bg-surface">
				{articles.map((a) => (
					<a
						key={a.id}
						href={a.url}
						className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-surface-elevated"
						target="_blank"
						rel="noreferrer"
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{a.title}</p>
							<p className="mt-1 text-xs text-muted-foreground">
								{a.source ? `${a.source} · ` : ""}
								{new Date(a.date).toLocaleDateString()}
							</p>
						</div>
						<ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
					</a>
				))}
			</div>
		</section>
	);
}

function Watermark() {
	return (
		<p className="pt-4 text-center text-xs text-muted-foreground">
			Made with{" "}
			<Link to="/" className="font-medium text-foreground hover:underline">
				DevLinks
			</Link>
		</p>
	);
}
