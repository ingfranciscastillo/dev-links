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
import { BlueskyBlock } from "@/components/profile/BlueskyBlock";
import { DevtoBlock } from "@/components/profile/DevtoBlock";
import { DockerhubBlock } from "@/components/profile/DockerhubBlock";
import { GithubBlock } from "@/components/profile/GithubBlock";
import { LeetcodeBlock } from "@/components/profile/LeetcodeBlock";
import { MastodonBlock } from "@/components/profile/MastodonBlock";
import { MediumBlock } from "@/components/profile/MediumBlock";
import { NpmBlock } from "@/components/profile/NpmBlock";
import { StackOverflowBlock } from "@/components/profile/StackOverflowBlock";
import { SupportBlock } from "@/components/profile/SupportBlock";
import { TalksBlock } from "@/components/profile/TalksBlock";
import { WakatimeBlock } from "@/components/profile/WakatimeBlock";
import { YoutubeBlock } from "@/components/profile/YoutubeBlock";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { trackClick, trackView } from "@/lib/analytics-track";
import {
	getPublicProfile,
	type PublicIntegration,
	type PublicProfile,
} from "@/lib/api/public-profile.functions";
import { iconForUrl } from "@/lib/icons";
import type {
	BlueskyPayload,
	DevtoPayload,
	DockerhubPayload,
	GithubPayload,
	LeetcodePayload,
	MastodonPayload,
	MediumPayload,
	NpmPayload,
	StackOverflowPayload,
	WakatimePayload,
	YoutubePayload,
} from "@/lib/integrations/types";
import type { ProfileData } from "@/lib/schemas";
import { themeToStyleTag } from "@/lib/theme-config";
import { hueFromString } from "@/lib/user";

type LoaderData = {
	live: NonNullable<PublicProfile>;
	username: string;
};

// Helper mínimo para clases condicionales sin traer una dependencia nueva.
function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

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
	const themed = Boolean(theme);
	// "narrow" deja de ser el mismo grid de 2 columnas aplastado y pasa a ser
	// un layout real de una sola columna (estilo link-in-bio clásico).
	const isNarrow = themed && theme?.cardWidth === "narrow";
	const avatarHue = hueFromString(live.id);

	useEffect(() => {
		trackView(username, `/${username}`);
	}, [username]);

	const styleTag = theme ? themeToStyleTag(theme, ".tt-scope") : "";

	return (
		<div className="tt-scope min-h-dvh overflow-x-clip bg-background text-foreground">
			{theme && (
				// biome-ignore lint/security/noDangerouslySetInnerHtml: theme styles are scoped to .tt-scope and generated server-side
				<style dangerouslySetInnerHTML={{ __html: styleTag }} />
			)}

			<ProfileHeader username={live.username} themed={themed} />

			<main
				className={cx(
					"mx-auto grid gap-8 px-4 pb-24 sm:px-6",
					themed ? "tt-container" : "max-w-6xl",
					isNarrow ? "lg:grid-cols-1" : "lg:grid-cols-[320px_minmax(0,1fr)]",
				)}
			>
				<ProfileSidebar
					name={live.name}
					username={live.username}
					bio={live.bio}
					location={live.location}
					website={live.website}
					available={live.available}
					avatarHue={avatarHue}
					themed={themed}
					stacked={isNarrow}
				/>

				<div className="min-w-0 space-y-10">
					<LinksSection
						links={live.data.links}
						themed={themed}
						username={username}
					/>

					{live.data.snippets.length > 0 && (
						<SnippetsSection snippets={live.data.snippets} themed={themed} />
					)}

					<ProjectsSection projects={live.data.projects} themed={themed} />

					<ArticlesSection articles={live.data.articles} themed={themed} />

					{live.data.talks.length > 0 && (
						<TalksBlock talks={live.data.talks} themed={themed} />
					)}

					{live.data.supportLinks.length > 0 && (
						<SupportBlock links={live.data.supportLinks} themed={themed} />
					)}

					{live.integrations.length > 0 && (
						<IntegrationBlocks
							integrations={live.integrations}
							themed={themed}
						/>
					)}

					<Watermark themed={themed} />
				</div>
			</main>
		</div>
	);
}

function IntegrationBlocks({
	integrations,
	themed,
}: {
	integrations: PublicIntegration[];
	themed: boolean;
}) {
	const by = (provider: string, kind: string) =>
		integrations.find((i) => i.provider === provider && i.kind === kind)
			?.payload;

	const gh = by("github", "profile") as GithubPayload | undefined;
	const dev = by("devto", "articles") as DevtoPayload | undefined;
	const md = by("medium", "posts") as MediumPayload | undefined;
	const so = by("stackoverflow", "profile") as StackOverflowPayload | undefined;

	const bluesky = by("bluesky", "feed") as BlueskyPayload | undefined;
	const dockerhub = by("dockerhub", "repos") as DockerhubPayload | undefined;
	const leetcode = by("leetcode", "stats") as LeetcodePayload | undefined;
	const mastodon = by("mastodon", "feed") as MastodonPayload | undefined;
	const npm = by("npm", "packages") as NpmPayload | undefined;
	const wakatime = by("wakatime", "stats") as WakatimePayload | undefined;
	const youtube = by("youtube", "videos") as YoutubePayload | undefined;

	return (
		<>
			{gh && <GithubBlock payload={gh} themed={themed} />}
			{dev && <DevtoBlock payload={dev} themed={themed} />}
			{md && <MediumBlock payload={md} themed={themed} />}
			{so && <StackOverflowBlock payload={so} themed={themed} />}

			{bluesky && <BlueskyBlock payload={bluesky} themed={themed} />}
			{dockerhub && <DockerhubBlock payload={dockerhub} themed={themed} />}
			{leetcode && <LeetcodeBlock payload={leetcode} themed={themed} />}
			{mastodon && <MastodonBlock payload={mastodon} themed={themed} />}
			{npm && <NpmBlock payload={npm} themed={themed} />}
			{wakatime && <WakatimeBlock payload={wakatime} themed={themed} />}
			{youtube && <YoutubeBlock payload={youtube} themed={themed} />}
		</>
	);
}

function SnippetsSection({
	snippets,
	themed,
}: {
	snippets: ProfileData["snippets"];
	themed: boolean;
}) {
	return (
		<section>
			<SectionTitle icon={Code2} title="Snippets" themed={themed} />
			<div className="grid gap-3">
				{snippets.map((s) => (
					<article
						key={s.id}
						className={cx(
							"overflow-hidden rounded-xl border",
							themed ? "tt-panel" : "border-hairline bg-surface",
						)}
					>
						<header
							className={cx(
								"flex items-center justify-between border-b px-4 py-2",
								themed ? "tt-border-c" : "border-hairline",
							)}
						>
							<span className="text-sm font-medium">{s.title}</span>
							<span
								className={cx(
									"font-mono text-[10px] uppercase tracking-wider",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								{s.language}
							</span>
						</header>
						<pre
							className={cx(
								"overflow-x-auto p-4 font-mono text-xs leading-relaxed",
								themed ? "tt-surface" : "bg-background/60",
							)}
						>
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
	themed,
}: {
	username: string;
	themed: boolean;
}) {
	return (
		<header
			className={cx(
				"sticky top-0 z-40 border-b",
				themed ? "tt-border-c" : "border-hairline",
			)}
			style={{
				backgroundColor: themed ? "var(--tt-bg)" : "var(--color-background)",
			}}
		>
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
				<Link
					to="/"
					className={cx(
						"font-mono text-xs transition-opacity",
						themed
							? "tt-muted hover:opacity-100"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					devlinks.com/
					<span
						className={themed ? undefined : "text-foreground"}
						style={themed ? { color: "var(--tt-fg)" } : undefined}
					>
						{username}
					</span>
				</Link>

				<div className="flex items-center gap-2">
					<button
						type="button"
						aria-label="Share profile"
						className={cx(
							"inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
							themed
								? "tt-panel tt-muted hover:opacity-80"
								: "border-border bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
						)}
					>
						<Share2 className="h-4 w-4" />
					</button>

					{!themed && <ThemeToggle />}
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
	themed,
	stacked,
}: {
	name: string;
	username: string;
	bio: string;
	location: string;
	website: string;
	available: boolean;
	avatarHue: number;
	themed: boolean;
	stacked?: boolean;
}) {
	return (
		<aside
			className={
				stacked
					? "min-w-0"
					: "min-w-0 lg:sticky lg:top-20 lg:h-fit lg:self-start"
			}
		>
			<div
				className={cx(
					"pt-10",
					stacked && "flex flex-col items-center text-center",
				)}
			>
				<div
					className={cx(
						"h-24 w-24 rounded-full",
						!themed && "ring-4 ring-background",
					)}
					style={{
						background: `linear-gradient(135deg, oklch(0.7 0.2 ${avatarHue}), oklch(0.4 0.18 ${avatarHue}))`,
						boxShadow: themed ? "0 0 0 4px var(--tt-bg)" : undefined,
					}}
				/>

				<h1 className="mt-4 text-2xl font-semibold tracking-tight">{name}</h1>

				<p
					className={cx(
						"text-sm",
						themed ? "tt-muted" : "text-muted-foreground",
					)}
				>
					@{username}
				</p>

				{available && (
					<span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-500">
						<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
						Available for hire
					</span>
				)}

				{bio && (
					<p
						className={cx(
							"mt-4 max-w-sm text-sm leading-relaxed",
							themed ? "tt-muted" : "text-muted-foreground",
						)}
					>
						{bio}
					</p>
				)}

				<ul
					className={cx(
						"mt-5 space-y-2 text-sm",
						themed ? "tt-muted" : "text-muted-foreground",
						stacked && "mx-auto w-fit text-left",
					)}
				>
					{location && (
						<li className="flex items-center gap-2">
							<MapPin className="h-3.5 w-3.5" />
							{location}
						</li>
					)}

					{website && (
						<li className="flex items-center gap-2">
							<Globe className="h-3.5 w-3.5" />

							<a
								href={website}
								className={
									themed ? "hover:opacity-80" : "hover:text-foreground"
								}
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
	themed,
}: {
	icon: React.ComponentType<{ className?: string }>;
	title: string;
	hint?: string;
	themed?: boolean;
}) {
	return (
		<div className="mb-4 flex items-baseline justify-between">
			<h2
				className={cx(
					"flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<Icon className="h-3.5 w-3.5" />
				{title}
			</h2>
			{hint && (
				<span
					className={cx(
						"font-mono text-xs",
						themed ? "tt-muted" : "text-muted-foreground",
					)}
				>
					{hint}
				</span>
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
			<SectionTitle icon={LinkIcon} title="Links" themed={themed} />
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
							<span
								className={cx(
									"grid h-10 w-10 place-items-center rounded-md border text-lg",
									themed ? "tt-panel" : "border-hairline bg-background",
								)}
							>
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

function ProjectsSection({
	projects,
	themed,
}: {
	projects: ProfileData["projects"];
	themed: boolean;
}) {
	if (projects.length === 0) return null;
	return (
		<section>
			<SectionTitle icon={Activity} title="Projects" themed={themed} />
			<div className="grid gap-3 sm:grid-cols-2">
				{projects.map((p) => (
					<div
						key={p.id}
						className={cx(
							"rounded-xl border p-4",
							themed ? "tt-panel" : "border-hairline bg-surface",
						)}
					>
						<div className="flex items-center justify-between">
							<p className="font-medium">{p.name}</p>
							<StatusBadge status={p.status} />
						</div>
						<p
							className={cx(
								"mt-1 text-sm",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							{p.description}
						</p>
						<div className="mt-3 flex flex-wrap gap-1.5">
							{p.tech.map((t) => (
								<span
									key={t}
									className={cx(
										"rounded-md px-2 py-0.5 font-mono text-[10px]",
										themed
											? "tt-surface tt-muted"
											: "bg-background text-muted-foreground",
									)}
								>
									{t}
								</span>
							))}
						</div>
						<div
							className={cx(
								"mt-3 flex gap-3 text-xs",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						>
							{p.github && (
								<a
									href={p.github}
									className={
										themed ? "hover:opacity-80" : "hover:text-foreground"
									}
									target="_blank"
									rel="noreferrer"
								>
									GitHub →
								</a>
							)}
							{p.demo && (
								<a
									href={p.demo}
									className={
										themed ? "hover:opacity-80" : "hover:text-foreground"
									}
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

// Colores de estado fijos a propósito: son semánticos (verde = shipped,
// ámbar = wip, gris = archived) y deben leerse igual sin importar el tema.
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

function ArticlesSection({
	articles,
	themed,
}: {
	articles: ProfileData["articles"];
	themed: boolean;
}) {
	if (articles.length === 0) return null;
	return (
		<section>
			<SectionTitle icon={MessageSquare} title="Writing" themed={themed} />
			<div
				className={cx(
					"divide-y overflow-hidden rounded-xl border",
					themed
						? "tt-panel divide-(--tt-border)"
						: "divide-hairline border-hairline bg-surface",
				)}
			>
				{articles.map((a) => (
					<a
						key={a.id}
						href={a.url}
						className={cx(
							"flex items-center justify-between gap-4 p-4 transition-colors",
							themed ? "hover:opacity-90" : "hover:bg-surface-elevated",
						)}
						target="_blank"
						rel="noreferrer"
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">{a.title}</p>
							<p
								className={cx(
									"mt-1 text-xs",
									themed ? "tt-muted" : "text-muted-foreground",
								)}
							>
								{a.source ? `${a.source} · ` : ""}
								{new Date(a.date).toLocaleDateString()}
							</p>
						</div>
						<ArrowUpRight
							className={cx(
								"h-4 w-4 shrink-0",
								themed ? "tt-muted" : "text-muted-foreground",
							)}
						/>
					</a>
				))}
			</div>
		</section>
	);
}

function Watermark({ themed }: { themed?: boolean }) {
	return (
		<p
			className={cx(
				"pt-4 text-center text-xs",
				themed ? "tt-muted" : "text-muted-foreground",
			)}
		>
			Made with{" "}
			<Link
				to="/"
				className={cx(
					"font-medium hover:underline",
					themed ? undefined : "text-foreground",
				)}
				style={themed ? { color: "var(--tt-fg)" } : undefined}
			>
				DevLinks
			</Link>
		</p>
	);
}
