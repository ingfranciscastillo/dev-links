import { CheckCircleIcon } from "@solar-icons/react/line-duotone";
import {
	ArrowRightIcon,
	ArrowRightUpIcon,
	CalendarIcon,
	CodeIcon,
	FolderWithFilesIcon,
	GlobalIcon,
	LinkMinimalistic2Icon,
	MapPointIcon,
	NotesIcon,
	ShareIcon,
} from "@solar-icons/react/linear";
import {
	createFileRoute,
	Link,
	notFound,
	useNavigate,
} from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import posthog from "posthog-js";
import {
	type FormEvent,
	type ReactNode,
	useEffect,
	useRef,
	useState,
} from "react";
import toast from "react-hot-toast";
import { SOCIAL_PLATFORM_ICONS } from "@/components/brand-icons";
import { ModalShell } from "@/components/dashboard/ModalShell";
import { BlueskyBlock } from "@/components/profile/BlueskyBlock";
import { DevtoBlock } from "@/components/profile/DevtoBlock";
import { DockerhubBlock } from "@/components/profile/DockerhubBlock";
import { DribbbleBlock } from "@/components/profile/DribbbleBlock";
import { GithubBlock } from "@/components/profile/GithubBlock";
import { GitlabBlock } from "@/components/profile/GitlabBlock";
import { HuggingfaceBlock } from "@/components/profile/HuggingfaceBlock";
import { LeetcodeBlock } from "@/components/profile/LeetcodeBlock";
import { MastodonBlock } from "@/components/profile/MastodonBlock";
import { MediumBlock } from "@/components/profile/MediumBlock";
import { NpmBlock } from "@/components/profile/NpmBlock";
import { PinterestBlock } from "@/components/profile/PinterestBlock";
import { ProducthuntBlock } from "@/components/profile/ProducthuntBlock";
import { StackOverflowBlock } from "@/components/profile/StackOverflowBlock";
import {
	CommunityBlock,
	SupportBlock,
} from "@/components/profile/SupportBlock";
import { TalksBlock } from "@/components/profile/TalksBlock";
import { WakatimeBlock } from "@/components/profile/WakatimeBlock";
import { YoutubeBlock } from "@/components/profile/YoutubeBlock";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import {
	type UsernameAvailability,
	useUsernameAvailability,
} from "@/hooks/use-username-availability";
import { trackClick, trackView } from "@/lib/analytics-track";
import {
	getPublicProfile,
	type PublicIntegration,
	type PublicProfile,
	type PublicSnippet,
} from "@/lib/api/public-profile.functions";
import { authClient } from "@/lib/auth-client";
import { COUNTRY_NAME_BY_CODE } from "@/lib/countries";
import { iconForUrl } from "@/lib/icons";
import type {
	BlueskyPayload,
	DevtoPayload,
	DockerhubPayload,
	DribbblePayload,
	GithubPayload,
	GitlabPayload,
	HuggingfacePayload,
	LeetcodePayload,
	MastodonPayload,
	MediumPayload,
	NpmPayload,
	PinterestPayload,
	ProductHuntPayload,
	StackOverflowPayload,
	WakatimePayload,
	YoutubePayload,
} from "@/lib/integrations/types";
import type { ProfileData } from "@/lib/schemas";
import { absoluteUrl } from "@/lib/site";
import { SOCIAL_PLATFORMS, type SocialLinks } from "@/lib/social-links";
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

// Mismo token de easing que ya usa el landing (Hero, Features, etc.) —
// las secciones bajo el fold del perfil público entran igual, no LinksSection
// (esa es el motivo por el que la gente llega a la página; debe ser
// clickeable al instante, sin delay de entrada).
const sectionEase = [0.16, 1, 0.3, 1] as const;

function RevealSection({ children }: { children: ReactNode }) {
	const reduceMotion = useReducedMotion();

	return (
		<motion.div
			initial={reduceMotion ? false : { opacity: 0, y: 16 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, amount: 0.2 }}
			transition={{ duration: reduceMotion ? 0.01 : 0.5, ease: sectionEase }}
		>
			{children}
		</motion.div>
	);
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
		const profileUrl = absoluteUrl(`/${params.username}`);

		const jsonLd = l
			? {
					"@context": "https://schema.org",
					"@type": "ProfilePage",
					mainEntity: {
						"@type": "Person",
						name: l.name,
						alternateName: params.username,
						...(l.bio ? { description: l.bio } : {}),
						url: profileUrl,
						...(l.image ? { image: l.image } : {}),
						...(l.website ? { sameAs: [l.website] } : {}),
					},
				}
			: null;

		return {
			meta: [
				{ title: `${name} (@${params.username}) — DevLinks` },
				{ name: "description", content: desc },
				{ property: "og:title", content: `${name} on DevLinks` },
				{ property: "og:description", content: desc },
				{ property: "og:type", content: "profile" },
				{ property: "og:url", content: profileUrl },
				{ name: "twitter:title", content: `${name} on DevLinks` },
				{ name: "twitter:description", content: desc },
				// Built-in JSON-LD support: renders a correctly-typed
				// <script type="application/ld+json"> with safe escaping.
				// A flat `scripts: [{ attrs: {...}, children }]` entry here
				// gets misassembled into a nested `attrs.attrs` by the
				// framework's headScripts merge, losing the `type` attr and
				// making the browser try (and fail) to execute it as JS.
				...(jsonLd ? [{ "script:ld+json": jsonLd }] : []),
			],
			links: [{ rel: "canonical", href: profileUrl }],
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

	const { data: session, isPending: isSessionPending } =
		authClient.useSession();
	const isOwner = session?.user?.id === live.id;

	// isSessionPending puede pasar por más de una transición al resolver
	// (better-auth revalida el cache de sesión), y cada una re-dispara este
	// efecto — sin el guard, cualquier transición que aterrice en "no
	// pending, no owner" volvía a llamar trackView, duplicando la vista real
	// (se veía como dos inserts a milisegundos de diferencia por cada visita).
	const trackedRef = useRef(false);

	useEffect(() => {
		if (isSessionPending || isOwner || trackedRef.current) return;
		trackedRef.current = true;
		trackView(username, `/${username}`);
	}, [username, isOwner, isSessionPending]);

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
					image={live.image}
					bio={live.bio}
					location={
						live.country
							? (COUNTRY_NAME_BY_CODE[live.country] ?? live.country)
							: ""
					}
					website={live.website}
					calendarLink={live.calendarLink}
					socialLinks={live.socialLinks}
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
						isOwner={isOwner}
					/>

					{live.data.snippets.length > 0 && (
						<RevealSection>
							<SnippetsSection snippets={live.data.snippets} themed={themed} />
						</RevealSection>
					)}

					<RevealSection>
						<ProjectsSection projects={live.data.projects} themed={themed} />
					</RevealSection>

					<RevealSection>
						<ArticlesSection articles={live.data.articles} themed={themed} />
					</RevealSection>

					{live.integrations.length > 0 && (
						<RevealSection>
							<IntegrationBlocks
								integrations={live.integrations}
								themed={themed}
							/>
						</RevealSection>
					)}

					{live.data.supportLinks.some((l) => l.category !== "community") && (
						<RevealSection>
							<SupportBlock links={live.data.supportLinks} themed={themed} />
						</RevealSection>
					)}

					{live.data.supportLinks.some((l) => l.category === "community") && (
						<RevealSection>
							<CommunityBlock links={live.data.supportLinks} themed={themed} />
						</RevealSection>
					)}

					{live.data.talks.length > 0 && (
						<RevealSection>
							<TalksBlock talks={live.data.talks} themed={themed} />
						</RevealSection>
					)}

					{live.plan !== "pro" && (
						<RevealSection>
							<Watermark
								themed={themed}
								username={username}
								isOwner={isOwner}
							/>
						</RevealSection>
					)}
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
	const gitlab = by("gitlab", "profile") as GitlabPayload | undefined;
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
	const huggingface = by("huggingface", "profile") as
		| HuggingfacePayload
		| undefined;
	const producthunt = by("producthunt", "profile") as
		| ProductHuntPayload
		| undefined;
	const dribbble = by("dribbble", "profile") as DribbblePayload | undefined;
	const pinterest = by("pinterest", "profile") as PinterestPayload | undefined;

	return (
		<div className="space-y-10">
			{gh && <GithubBlock payload={gh} themed={themed} />}
			{gitlab && <GitlabBlock payload={gitlab} themed={themed} />}
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
			{huggingface && (
				<HuggingfaceBlock payload={huggingface} themed={themed} />
			)}
			{producthunt && (
				<ProducthuntBlock payload={producthunt} themed={themed} />
			)}
			{dribbble && <DribbbleBlock payload={dribbble} themed={themed} />}
			{pinterest && <PinterestBlock payload={pinterest} themed={themed} />}
		</div>
	);
}

function SnippetsSection({
	snippets,
	themed,
}: {
	snippets: PublicSnippet[];
	themed: boolean;
}) {
	return (
		<section>
			<SectionTitle icon={CodeIcon} title="Snippets" themed={themed} />
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
						<div
							className={cx(
								"overflow-x-auto p-4 font-mono text-xs leading-relaxed [&_pre]:overflow-visible [&_pre]:whitespace-pre",
								themed ? "tt-surface" : "bg-background/60",
							)}
							// biome-ignore lint/security/noDangerouslySetInnerHtml: server-rendered Shiki output, not user-controlled HTML
							dangerouslySetInnerHTML={{ __html: s.html }}
						/>
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
	async function handleShare() {
		try {
			await navigator.clipboard.writeText(window.location.href);
			toast.success("Link copied to clipboard");
		} catch {
			toast.error("Couldn't copy");
		}
	}

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
						onClick={handleShare}
						aria-label="Share profile"
						className={cx(
							"inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors",
							themed
								? "tt-panel tt-muted hover:opacity-80"
								: "border-border bg-surface text-muted-foreground hover:bg-surface-elevated hover:text-foreground",
						)}
					>
						<ShareIcon className="h-4 w-4" />
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
	image,
	bio,
	location,
	website,
	calendarLink,
	socialLinks,
	available,
	avatarHue,
	themed,
	stacked,
}: {
	name: string;
	username: string;
	image: string | null;
	bio: string;
	location: string;
	website: string;
	calendarLink: string;
	socialLinks: SocialLinks;
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
				{image ? (
					<img
						src={image}
						alt={name}
						className={cx(
							"h-24 w-24 rounded-full object-cover",
							!themed && "ring-4 ring-background",
						)}
						style={{
							boxShadow: themed ? "0 0 0 4px var(--tt-bg)" : undefined,
						}}
					/>
				) : (
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
				)}

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
							<MapPointIcon className="h-3.5 w-3.5" />
							{location}
						</li>
					)}

					{website && (
						<li className="flex items-center gap-2">
							<GlobalIcon className="h-3.5 w-3.5" />

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

					{calendarLink && (
						<li className="flex items-center gap-2">
							<CalendarIcon className="h-3.5 w-3.5" />

							<a
								href={calendarLink}
								className={
									themed ? "hover:opacity-80" : "hover:text-foreground"
								}
								target="_blank"
								rel="noreferrer"
							>
								Book a call
							</a>
						</li>
					)}
				</ul>

				{SOCIAL_PLATFORMS.some((p) => socialLinks[p.key]) && (
					<div
						className={cx(
							"mt-5 flex flex-wrap items-center gap-4",
							stacked && "justify-center",
						)}
					>
						{SOCIAL_PLATFORMS.filter((p) => socialLinks[p.key]).map(
							(platform) => {
								const Icon = SOCIAL_PLATFORM_ICONS[platform.key];
								const username = socialLinks[platform.key];
								if (!username) return null;

								return (
									<a
										key={platform.key}
										href={platform.buildUrl(username)}
										aria-label={platform.label}
										title={platform.label}
										className={cx(
											themed
												? "opacity-70 hover:opacity-100"
												: "text-muted-foreground hover:text-foreground",
										)}
										target="_blank"
										rel="noreferrer"
									>
										<Icon size={16} />
									</a>
								);
							},
						)}
					</div>
				)}
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
	isOwner,
}: {
	links: ProfileData["links"];
	themed: boolean;
	username: string;
	isOwner: boolean;
}) {
	if (links.length === 0) return null;
	return (
		<section className="pt-10">
			<SectionTitle
				icon={LinkMinimalistic2Icon}
				title="Links"
				themed={themed}
			/>
			<div className="grid gap-2">
				{links.map((l) => {
					const Icon = iconForUrl(l.url);
					return (
						<a
							key={l.id}
							href={l.url}
							target="_blank"
							rel="noreferrer"
							onClick={() => {
								if (isOwner) return;
								trackClick({
									username,
									linkId: l.id,
									url: l.url,
									title: l.title,
								});
							}}
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
								style={themed ? { color: "var(--tt-fg)" } : undefined}
							>
								<Icon className="h-4 w-4" />
							</span>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{l.title}</p>
								{l.description && (
									<p className="truncate text-xs opacity-70">{l.description}</p>
								)}
							</div>
							<ArrowRightUpIcon className="h-4 w-4 opacity-70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
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
			<SectionTitle
				icon={FolderWithFilesIcon}
				title="Projects"
				themed={themed}
			/>
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
									className={cx(
										"inline-flex items-center gap-1",
										themed ? "hover:opacity-80" : "hover:text-foreground",
									)}
									target="_blank"
									rel="noreferrer"
								>
									GitHub <ArrowRightIcon className="h-3 w-3" />
								</a>
							)}
							{p.demo && (
								<a
									href={p.demo}
									className={cx(
										"inline-flex items-center gap-1",
										themed ? "hover:opacity-80" : "hover:text-foreground",
									)}
									target="_blank"
									rel="noreferrer"
								>
									Live demo <ArrowRightIcon className="h-3 w-3" />
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
			<SectionTitle icon={NotesIcon} title="Writing" themed={themed} />
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
						<ArrowRightUpIcon
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

const CLAIM_STATUS_COPY: Record<UsernameAvailability, string | null> = {
	idle: null,
	invalid: "At least 3 characters, a-z 0-9 _ -",
	checking: "Checking…",
	available: "Available",
	taken: "Already taken",
};

function Watermark({
	themed,
	username,
	isOwner,
}: {
	themed?: boolean;
	username: string;
	isOwner: boolean;
}) {
	const reduceMotion = useReducedMotion();
	const [open, setOpen] = useState(false);

	return (
		<>
			<p
				className={cx(
					"pt-4 text-center text-xs",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<motion.button
					type="button"
					whileHover={reduceMotion ? undefined : { scale: 1.03 }}
					whileTap={reduceMotion ? undefined : { scale: 0.98 }}
					transition={{ duration: 0.15, ease: sectionEase }}
					onClick={() => {
						if (!isOwner) {
							posthog.capture("watermark_click", { source_username: username });
						}
						setOpen(true);
					}}
					className={cx(
						"inline-block font-medium hover:underline",
						themed ? undefined : "text-foreground",
					)}
					style={themed ? { color: "var(--tt-fg)" } : undefined}
				>
					Made with DevLinks — make yours free
				</motion.button>
			</p>

			{open && (
				<ClaimUsernameModal
					sourceUsername={username}
					onClose={() => setOpen(false)}
				/>
			)}
		</>
	);
}

// Mismo flujo de claim que el CTA del landing (src/components/landing/cta.tsx)
// — check de disponibilidad debounced contra el mismo endpoint — pero
// disparado desde el watermark en vez de requerir navegar a "/" primero.
function ClaimUsernameModal({
	sourceUsername,
	onClose,
}: {
	sourceUsername: string;
	onClose: () => void;
}) {
	const navigate = useNavigate();
	const [value, setValue] = useState("");
	const status = useUsernameAvailability(value);

	function handleSubmit(event: FormEvent) {
		event.preventDefault();
		const trimmed = value.trim().toLowerCase();
		posthog.capture("watermark_claim_submitted", {
			source_username: sourceUsername,
			claimed_username: trimmed,
			status,
		});
		navigate({ to: "/signup", search: { username: trimmed || undefined } });
	}

	return (
		<ModalShell title="Your address is waiting." onClose={onClose}>
			<p className="text-sm leading-relaxed text-muted-foreground">
				Sign up in 30 seconds. Connect your services. Share one profile
				everywhere.
			</p>

			<form onSubmit={handleSubmit} className="mt-6">
				<label htmlFor="claim-username" className="sr-only">
					Your username
				</label>

				<motion.div
					animate={status === "taken" ? { x: [0, -3, 3, 0] } : { x: 0 }}
					transition={{ duration: 0.2, ease: sectionEase }}
					className={cx(
						"flex items-center border-b pb-2 transition-colors focus-within:border-brand",
						status === "taken" ? "border-destructive" : "border-foreground",
					)}
				>
					<span className="shrink-0 font-mono text-[12px] text-muted-foreground">
						devlinks.com/
					</span>

					<input
						id="claim-username"
						// biome-ignore lint/a11y/noAutofocus: modal opens from an explicit click, autofocus is expected here
						autoFocus
						placeholder="your-handle"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						autoComplete="off"
						spellCheck={false}
						className="min-w-0 flex-1 bg-transparent px-1 font-mono text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none"
					/>

					<AnimatePresence>
						{status === "available" && (
							<motion.span
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								transition={{ duration: 0.15, ease: sectionEase }}
								className="shrink-0 text-brand"
							>
								<CheckCircleIcon size={16} secondaryOpacity={0} />
							</motion.span>
						)}
					</AnimatePresence>
				</motion.div>

				<div className="mt-3 min-h-4">
					<AnimatePresence mode="wait">
						<motion.p
							key={status}
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 4 }}
							transition={{ duration: 0.15, ease: sectionEase }}
							className={cx(
								"font-mono text-[9px] uppercase tracking-[0.08em]",
								status === "taken"
									? "text-destructive"
									: status === "available"
										? "text-brand"
										: "text-muted-foreground",
							)}
						>
							{CLAIM_STATUS_COPY[status] ?? "No credit card · Free forever"}
						</motion.p>
					</AnimatePresence>
				</div>

				<button
					type="submit"
					className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 bg-foreground font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none transition-colors hover:bg-brand hover:text-brand-foreground"
				>
					Claim my page
					<ArrowRightIcon className="h-3.5 w-3.5" />
				</button>

				<p className="mt-5 border-t border-border pt-4 text-center font-mono text-[9px] uppercase tracking-[0.06em] text-muted-foreground">
					GitHub-synced · Free forever · No credit card
				</p>
			</form>
		</ModalShell>
	);
}
