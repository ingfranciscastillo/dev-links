import { ArrowRightUpIcon } from "@solar-icons/react/linear";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion, useReducedMotion } from "motion/react";
import { useDeferredValue, useMemo, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
	type DiscoverResult,
	searchProfiles,
} from "@/lib/api/discover.functions";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { COUNTRIES, COUNTRY_NAME_BY_CODE } from "@/lib/countries";

const LANGUAGES = [
	"TypeScript",
	"JavaScript",
	"Rust",
	"Go",
	"Python",
	"Elixir",
	"Ruby",
	"Swift",
];

const SENIORITIES = ["junior", "mid", "senior", "staff", "principal"];

const DEFAULT_FILTERS = {
	q: "",
	language: null as string | null,
	seniority: null as string | null,
	available: null as boolean | null,
	country: null as string | null,
	technologies: [] as string[],
	limit: 24,
};

function isDefaultFilters(filters: typeof DEFAULT_FILTERS) {
	return (
		filters.q === "" &&
		filters.language === null &&
		filters.seniority === null &&
		filters.available === null &&
		filters.country === null &&
		filters.technologies.length === 0
	);
}

const ease = [0.16, 1, 0.3, 1] as const;

export const Route = createFileRoute("/discover")({
	// Sin loader, el primer render llega vacío y espera un round-trip
	// completo cliente → server function → Neon (con cold start) antes de
	// mostrar resultados. Precargarlos en el server durante el SSR evita
	// ese waterfall en la primera visita.
	loader: async () => searchProfiles({ data: DEFAULT_FILTERS }),
	head: () => ({
		meta: [
			{ title: "Discover developers — DevLinks" },
			{
				name: "description",
				content:
					"Search developer profiles on DevLinks. Filter by language, country, technologies, seniority and availability.",
			},
			{
				property: "og:title",
				content: "Discover developers — DevLinks",
			},
			{
				property: "og:description",
				content:
					"Search developer profiles. Filter by language, country, technologies, seniority and availability.",
			},
			{ property: "og:url", content: "/discover" },
		],
		links: [{ rel: "canonical", href: "/discover" }],
	}),
	component: Discover,
});

function Discover() {
	const searchProfilesFn = useServerFn(searchProfiles);
	const loaderData = Route.useLoaderData();
	const reduceMotion = useReducedMotion();

	const [q, setQ] = useState("");
	const [language, setLanguage] = useState<string | null>(null);
	const [seniority, setSeniority] = useState<string | null>(null);
	const [available, setAvailable] = useState(false);
	const [country, setCountry] = useState("");

	const deferredQ = useDeferredValue(q);

	const filters = useMemo(
		() => ({
			q: deferredQ,
			language,
			seniority,
			available: available ? true : null,
			country: country.trim() || null,
			technologies: [] as string[],
			limit: 24,
		}),
		[deferredQ, language, seniority, available, country],
	);

	const { data, isFetching } = useQuery({
		queryKey: ["discover", filters],
		queryFn: () => searchProfilesFn({ data: filters }),
		placeholderData: (previous) => previous,
		initialData: isDefaultFilters(filters) ? loaderData : undefined,
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
							value={q}
							onChange={(event) => setQ(event.target.value)}
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

					<div className="mt-5 grid gap-6 border-b border-border pb-6 sm:grid-cols-2 sm:items-start lg:grid-cols-4">
						<div>
							<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
								Language
							</p>

							<motion.div
								className="mt-3 flex flex-wrap gap-x-4 gap-y-2"
								initial="hidden"
								animate="visible"
								variants={{
									hidden: {},
									visible: {
										transition: {
											staggerChildren: reduceMotion ? 0 : 0.025,
										},
									},
								}}
							>
								{LANGUAGES.map((item) => (
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
											active={language === item}
											onClick={() =>
												setLanguage(language === item ? null : item)
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
											active={seniority === item}
											onClick={() =>
												setSeniority(seniority === item ? null : item)
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

							<Select
								value={country || "ALL"}
								onValueChange={(value) =>
									setCountry(value === "ALL" ? "" : value)
								}
							>
								<SelectTrigger
									aria-label="Country"
									className="mt-3 h-9 w-full rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground shadow-none focus:ring-0"
								>
									<SelectValue />
								</SelectTrigger>

								<SelectContent>
									<SelectItem value="ALL">All</SelectItem>
									{COUNTRIES.map((c) => (
										<SelectItem key={c.code} value={c.code}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div>
							<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
								Availability
							</p>

							<div className="mt-3">
								<FilterButton
									active={available}
									onClick={() => setAvailable((value) => !value)}
								>
									<span
										className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
											available ? "bg-brand" : "bg-muted-foreground/40"
										}`}
									/>
									Available for hire
								</FilterButton>
							</div>
						</div>
					</div>
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

						{p.location && (
							<p className="mt-1 max-w-32 truncate text-xs text-muted-foreground">
								{p.location}
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
