import { AltArrowDownIcon, ArrowRightUpIcon } from "@solar-icons/react/linear";
import { useQuery } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	stripSearchParams,
	useNavigate,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import posthog from "posthog-js";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { SearchableSelect } from "@/components/ui/searchable-select";
import {
	type DiscoverResult,
	searchProfiles,
} from "@/lib/api/discover.functions";
import { COUNTRIES, COUNTRY_NAME_BY_CODE } from "@/lib/countries";
import { LANGUAGES } from "@/lib/languages";
import { absoluteUrl } from "@/lib/site";

const SENIORITIES = ["junior", "mid", "senior", "staff", "principal"] as const;

// .catch() (not .default()) so a malformed/hand-edited query string falls
// back cleanly instead of 500ing the loader — every field tolerates being
// absent or the wrong type.
const discoverSearchSchema = z.object({
	q: z.string().max(120).catch(""),
	language: z.string().max(40).nullable().catch(null),
	seniority: z.enum(SENIORITIES).nullable().catch(null),
	available: z.boolean().catch(false),
	country: z.string().max(4).nullable().catch(null),
	technologies: z.array(z.string().max(40)).max(8).catch([]),
});

type DiscoverSearch = z.infer<typeof discoverSearchSchema>;

// Cada combinación de filtros es ahora una URL propia (/discover?language=…)
// — bueno para SEO programático, pero una combinación con pocos resultados
// es justo el "thin content" que Google penaliza si se indexa. Por debajo
// de este umbral, la página sigue siendo usable pero se marca noindex.
const MIN_INDEXABLE_RESULTS = 5;

function hasActiveFilters(search: DiscoverSearch) {
	return (
		search.q.trim() !== "" ||
		search.language !== null ||
		search.seniority !== null ||
		search.available ||
		search.country !== null ||
		search.technologies.length > 0
	);
}

// Reconstruye la URL con solo los params no-default, en un orden fijo, para
// que el canonical sea estable sin importar en qué orden se tocaron los
// filtros. Nota: technologies (array) se serializa distinto a como lo hace
// el querystring por defecto del router para arrays — es el único campo
// donde el canonical puede no ser byte-idéntico a la URL real; no afecta a
// los filtros simples (language/seniority/country/available) que son el
// objetivo real de estas páginas.
function buildDiscoverPath(search: DiscoverSearch) {
	const params = new URLSearchParams();
	if (search.q.trim()) params.set("q", search.q.trim());
	if (search.language) params.set("language", search.language);
	if (search.seniority) params.set("seniority", search.seniority);
	if (search.available) params.set("available", "true");
	if (search.country) params.set("country", search.country);
	if (search.technologies.length > 0)
		params.set("technologies", JSON.stringify(search.technologies));
	const qs = params.toString();
	return qs ? `/discover?${qs}` : "/discover";
}

function filterLabel(search: DiscoverSearch): string | null {
	const parts: string[] = [];
	if (search.language) parts.push(search.language);
	if (search.seniority) parts.push(search.seniority);
	if (search.country)
		parts.push(COUNTRY_NAME_BY_CODE[search.country] ?? search.country);
	if (search.available) parts.push("available for hire");
	return parts.length > 0 ? parts.join(", ") : null;
}

const ease = [0.16, 1, 0.3, 1] as const;

export const Route = createFileRoute("/discover")({
	validateSearch: discoverSearchSchema,
	search: {
		middlewares: [
			stripSearchParams({
				q: "",
				language: null,
				seniority: null,
				available: false,
				country: null,
				technologies: [],
			}),
		],
	},
	// El loader depende de los search params validados — sin loaderDeps,
	// TanStack Router no vuelve a llamarlo cuando solo cambian los filtros
	// (misma ruta, mismo componente), y la navegación por URL (compartir un
	// link filtrado, ir/volver) mostraría datos de otra combinación de filtros.
	loaderDeps: ({ search }) => search,
	loader: async ({ deps }) => searchProfiles({ data: { ...deps, limit: 24 } }),
	head: ({ match, loaderData }) => {
		const search = match.search as DiscoverSearch;
		const resultCount = loaderData?.length ?? 0;
		const filtered = hasActiveFilters(search);
		const label = filterLabel(search);

		const title = label
			? `${label} developers — Discover — DevLinks`
			: "Discover developers — DevLinks";
		const description = label
			? `Browse developer profiles matching ${label} on DevLinks.`
			: "Search developer profiles on DevLinks. Filter by language, country, technologies, seniority and availability.";

		const shouldNoindex = filtered && resultCount < MIN_INDEXABLE_RESULTS;
		const canonicalPath = buildDiscoverPath(search);

		return {
			meta: [
				{ title },
				{ name: "description", content: description },
				{
					name: "robots",
					content: shouldNoindex ? "noindex, follow" : "index, follow",
				},
				{ property: "og:title", content: title },
				{ property: "og:description", content: description },
				{ property: "og:url", content: absoluteUrl(canonicalPath) },
			],
			links: [{ rel: "canonical", href: absoluteUrl(canonicalPath) }],
		};
	},
	component: Discover,
});

function Discover() {
	const searchProfilesFn = useServerFn(searchProfiles);
	const loaderData = Route.useLoaderData();
	const search = Route.useSearch();
	const navigate = useNavigate({ from: Route.fullPath });
	const reduceMotion = useReducedMotion();

	// El input de texto queda local + debounced antes de escribir a la URL —
	// escribir a la URL (y por tanto re-disparar el loader) en cada tecla
	// sería tanto una navegación de más como un re-fetch de más.
	const [qInput, setQInput] = useState(search.q);
	const [filtersOpen, setFiltersOpen] = useState(true);

	useEffect(() => {
		setQInput(search.q);
	}, [search.q]);

	useEffect(() => {
		const trimmed = qInput.trim();
		if (trimmed === search.q) return;
		const timer = setTimeout(() => {
			navigate({
				search: (prev) => ({ ...prev, q: trimmed }),
				replace: true,
			});
		}, 400);
		return () => clearTimeout(timer);
	}, [navigate, qInput, search.q]);

	const filters = useMemo(
		() => ({
			q: search.q,
			language: search.language,
			seniority: search.seniority,
			available: search.available ? true : null,
			country: search.country,
			technologies: search.technologies,
			limit: 24,
		}),
		[
			search.q,
			search.language,
			search.seniority,
			search.available,
			search.country,
			search.technologies,
		],
	);

	// Skips the initial mount — landing on /discover already counts as a
	// pageview; this is specifically for the user changing filters, not for
	// arriving at the page with some already in the URL.
	const mounted = useRef(false);
	useEffect(() => {
		if (!mounted.current) {
			mounted.current = true;
			return;
		}
		posthog.capture("discover_search_performed", {
			has_filters: hasActiveFilters(search),
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filters]);

	const { data, isFetching } = useQuery({
		queryKey: ["discover", filters],
		queryFn: () => searchProfilesFn({ data: filters }),
		placeholderData: (previous) => previous,
		initialData: loaderData,
	});

	const results = data ?? [];

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
				<motion.header
					initial={reduceMotion ? false : { opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.7,
						ease,
					}}
					className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end"
				>
					<div>
						<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
							Discover / Directory
						</p>

						<h1 className="mt-5 max-w-4xl font-display text-[12vw] leading-[0.9] tracking-[-0.045em] sm:text-7xl lg:text-8xl">
							Find the people
							<br />
							behind the work.
						</h1>
					</div>

					<p className="max-w-sm text-[15px] leading-relaxed text-muted-foreground lg:justify-self-end">
						Explore developer profiles by stack, experience, location, and
						availability.
					</p>
				</motion.header>

				<motion.div
					initial={reduceMotion ? false : { opacity: 0, y: 16 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.6,
						delay: reduceMotion ? 0 : 0.1,
						ease,
					}}
					className="mt-14 border-t border-border pt-6 sm:mt-20"
				>
					<div className="flex items-center gap-4 border-b border-foreground pb-3">
						<span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-brand">
							Search
						</span>

						<input
							value={qInput}
							onChange={(event) => setQInput(event.target.value)}
							placeholder="Name, bio, technologies..."
							aria-label="Search developers"
							className="min-w-0 flex-1 bg-transparent font-display text-xl tracking-[-0.02em] text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-2xl"
						/>

						<motion.span
							animate={{
								opacity: isFetching ? 1 : 0,
							}}
							transition={{ duration: 0.18 }}
							aria-hidden={!isFetching}
							className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
						>
							Searching
						</motion.span>
					</div>

					<button
						type="button"
						onClick={() => setFiltersOpen((v) => !v)}
						aria-expanded={filtersOpen}
						className="group mt-5 flex w-full items-center justify-between gap-4 py-2 text-left"
					>
						<span className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-brand transition-colors group-hover:text-foreground">
							Filters
							{hasActiveFilters(search) && (
								<span className="h-1.5 w-1.5 rounded-full bg-brand" />
							)}
						</span>

						<span className="flex min-w-0 items-center gap-3">
							{!filtersOpen && filterLabel(search) && (
								<span className="truncate font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
									{filterLabel(search)}
								</span>
							)}

							<AltArrowDownIcon
								size={12}
								className={`shrink-0 text-muted-foreground transition-transform duration-200 ${
									filtersOpen ? "rotate-180" : ""
								}`}
							/>
						</span>
					</button>

					<AnimatePresence initial={false}>
						{filtersOpen && (
							<motion.div
								key="filters"
								initial={reduceMotion ? false : { height: 0, opacity: 0 }}
								animate={{ height: "auto", opacity: 1 }}
								exit={reduceMotion ? {} : { height: 0, opacity: 0 }}
								transition={{ duration: reduceMotion ? 0.01 : 0.35, ease }}
								className="overflow-hidden"
							>
								<div className="grid gap-6 pt-4 pb-6 sm:grid-cols-2 sm:items-start lg:grid-cols-4">
									<div>
										<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
											Language
										</p>

										<SearchableSelect
											id="discover-language"
											value={search.language ?? "ALL"}
											onValueChange={(value) =>
												navigate({
													search: (prev) => ({
														...prev,
														language: value === "ALL" ? null : value,
													}),
													replace: true,
												})
											}
											options={[
												{ value: "ALL", label: "All" },
												...LANGUAGES.map((item) => ({
													value: item,
													label: item,
												})),
											]}
											searchPlaceholder="Search languages…"
											emptyText="No language found."
											className="mt-3 h-9 w-full rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground shadow-none"
										/>
									</div>

									<div>
										<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
											Seniority
										</p>

										<motion.div
											className="mt-3 flex flex-wrap gap-x-4 gap-y-2"
											initial="hidden"
											animate="visible"
											variants={{
												hidden: {},
												visible: {
													transition: {
														staggerChildren: reduceMotion ? 0 : 0.03,
													},
												},
											}}
										>
											{SENIORITIES.map((item) => (
												<motion.div
													key={item}
													variants={{
														hidden: reduceMotion ? {} : { opacity: 0, y: 6 },
														visible: {
															opacity: 1,
															y: 0,
															transition: {
																duration: reduceMotion ? 0.01 : 0.3,
																ease,
															},
														},
													}}
												>
													<FilterButton
														active={search.seniority === item}
														onClick={() =>
															navigate({
																search: (prev) => ({
																	...prev,
																	seniority:
																		prev.seniority === item ? null : item,
																}),
																replace: true,
															})
														}
													>
														{item}
													</FilterButton>
												</motion.div>
											))}
										</motion.div>
									</div>

									<div>
										<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
											Country
										</p>

										<SearchableSelect
											id="discover-country"
											value={search.country ?? "ALL"}
											onValueChange={(value) =>
												navigate({
													search: (prev) => ({
														...prev,
														country: value === "ALL" ? null : value,
													}),
													replace: true,
												})
											}
											options={[
												{ value: "ALL", label: "All" },
												...COUNTRIES.map((c) => ({
													value: c.code,
													label: c.name,
												})),
											]}
											searchPlaceholder="Search countries…"
											emptyText="No country found."
											className="mt-3 h-9 w-full rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground shadow-none"
										/>
									</div>

									<div>
										<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
											Availability
										</p>

										<div className="mt-3">
											<FilterButton
												active={search.available}
												onClick={() =>
													navigate({
														search: (prev) => ({
															...prev,
															available: !prev.available,
														}),
														replace: true,
													})
												}
											>
												<span
													className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
														search.available
															? "bg-brand"
															: "bg-muted-foreground/40"
													}`}
												/>
												Available for hire
											</FilterButton>
										</div>
									</div>
								</div>
							</motion.div>
						)}
					</AnimatePresence>

					<div className="border-b border-border" />
				</motion.div>

				<motion.div
					initial={reduceMotion ? false : { opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{
						duration: reduceMotion ? 0.01 : 0.5,
						delay: reduceMotion ? 0 : 0.2,
						ease,
					}}
					className="mt-10 flex items-end justify-between border-b border-border pb-3"
				>
					<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
						Developers
					</p>

					<motion.p
						key={results.length}
						initial={reduceMotion ? false : { opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: reduceMotion ? 0.01 : 0.25,
							ease,
						}}
						className="font-mono text-[10px] tabular-nums text-muted-foreground"
					>
						{results.length.toString().padStart(2, "0")}
					</motion.p>
				</motion.div>

				<div>
					{results.length === 0 && !isFetching ? (
						<motion.div
							initial={reduceMotion ? false : { opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{
								duration: reduceMotion ? 0.01 : 0.5,
								ease,
							}}
							className="border-b border-border py-14"
						>
							<p className="font-display text-2xl tracking-[-0.02em]">
								No developers found.
							</p>

							<p className="mt-2 text-sm text-muted-foreground">
								Try changing your search or removing some filters.
							</p>
						</motion.div>
					) : (
						<motion.div
							initial="hidden"
							animate="visible"
							variants={{
								hidden: {},
								visible: {
									transition: {
										staggerChildren: reduceMotion ? 0 : 0.06,
									},
								},
							}}
						>
							{results.map((profile, index) => (
								<ProfileRow
									key={profile.id}
									profile={profile}
									index={index}
									reduceMotion={reduceMotion}
								/>
							))}
						</motion.div>
					)}
				</div>
			</main>

			<Footer />
		</div>
	);
}

function FilterButton({
	children,
	active,
	onClick,
}: {
	children: React.ReactNode;
	active: boolean;
	onClick: () => void;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`font-mono text-[10px] uppercase tracking-wider transition-colors ${
				active ? "text-brand" : "text-muted-foreground hover:text-foreground"
			}`}
		>
			{active && <span className="mr-1.5">/</span>}
			{children}
		</button>
	);
}

function ProfileRow({
	profile: p,
	index,
	reduceMotion,
}: {
	profile: DiscoverResult;
	index: number;
	reduceMotion: boolean | null;
}) {
	return (
		<motion.div
			variants={{
				hidden: reduceMotion
					? {}
					: {
							opacity: 0,
							y: 16,
						},
				visible: {
					opacity: 1,
					y: 0,
					transition: {
						duration: reduceMotion ? 0.01 : 0.5,
						ease,
					},
				},
			}}
		>
			<Link
				to="/$username"
				params={{ username: p.username }}
				search={{ ref: "discover" }}
				className="group grid gap-5 border-b border-border py-7 transition-colors hover:bg-surface sm:grid-cols-[4rem_minmax(0,1.4fr)_minmax(14rem,0.8fr)_auto] sm:items-center sm:px-3 sm:py-8"
			>
				<span className="font-mono text-[10px] tabular-nums text-muted-foreground">
					{String(index + 1).padStart(2, "0")}
				</span>

				<div className="min-w-0">
					<div className="flex items-center gap-3">
						<h2 className="truncate font-display text-2xl tracking-tight sm:text-3xl">
							{p.name || p.username}
						</h2>

						{p.available && (
							<span className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.08em] text-brand">
								<span className="h-1.5 w-1.5 rounded-full bg-brand" />
								Open
							</span>
						)}
					</div>

					<p className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground">
						@{p.username}
						{p.seniority ? ` · ${p.seniority}` : ""}
						{p.primary_language ? ` · ${p.primary_language}` : ""}
					</p>

					{p.bio && (
						<p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							{p.bio}
						</p>
					)}
				</div>

				<div className="flex flex-wrap gap-x-3 gap-y-1 sm:justify-self-start">
					{p.technologies.slice(0, 5).map((technology) => (
						<span
							key={technology}
							className="font-mono text-[9px] uppercase tracking-[0.04em] text-muted-foreground"
						>
							{technology}
						</span>
					))}
				</div>

				<div className="flex items-center gap-4 sm:justify-self-end">
					<div className="text-right">
						{p.country && (
							<p className="font-mono text-[10px] text-muted-foreground">
								{COUNTRY_NAME_BY_CODE[p.country] ?? p.country}
							</p>
						)}
					</div>

					<span className="font-mono text-xs text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand">
						<ArrowRightUpIcon width={16} height={16} />
					</span>
				</div>
			</Link>
		</motion.div>
	);
}
