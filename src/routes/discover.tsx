import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";

import { useDeferredValue, useMemo, useState } from "react";

import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

import {
	type DiscoverResult,
	searchProfiles,
} from "@/lib/api/discover.functions";

export const Route = createFileRoute("/discover")({
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

function Discover() {
	const searchProfilesFn = useServerFn(searchProfiles);

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
	});

	const results = data ?? [];

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 pb-24 pt-20 sm:px-8 sm:pt-28">
				<header className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
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
				</header>

				<div className="mt-14 border-t border-border pt-6 sm:mt-20">
					<div className="flex items-center gap-4 border-b border-foreground pb-3">
						<span className="font-mono text-[10px] uppercase tracking-widest text-brand">
							Search
						</span>

						<input
							value={q}
							onChange={(event) => setQ(event.target.value)}
							placeholder="Name, bio, technologies..."
							aria-label="Search developers"
							className="min-w-0 flex-1 bg-transparent font-display text-xl tracking-[-0.02em] text-foreground placeholder:text-muted-foreground focus:outline-none sm:text-2xl"
						/>

						{isFetching && (
							<span
								aria-hidden="true"
								className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground"
							>
								Searching
							</span>
						)}
					</div>

					<div className="mt-5 grid gap-5 border-b border-border pb-6 sm:grid-cols-[auto_1fr_auto] sm:items-start">
						<div>
							<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
								Language
							</p>

							<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
								{LANGUAGES.map((item) => (
									<FilterButton
										key={item}
										active={language === item}
										onClick={() => setLanguage(language === item ? null : item)}
									>
										{item}
									</FilterButton>
								))}
							</div>
						</div>

						<div>
							<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
								Seniority
							</p>

							<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
								{SENIORITIES.map((item) => (
									<FilterButton
										key={item}
										active={seniority === item}
										onClick={() =>
											setSeniority(seniority === item ? null : item)
										}
									>
										{item}
									</FilterButton>
								))}
							</div>
						</div>

						<div className="flex items-end gap-4 sm:justify-self-end">
							<button
								type="button"
								onClick={() => setAvailable((value) => !value)}
								className={`inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.08em] transition-colors ${
									available
										? "text-brand"
										: "text-muted-foreground hover:text-foreground"
								}`}
							>
								<span
									className={`h-1.5 w-1.5 rounded-full ${
										available ? "bg-brand" : "bg-muted-foreground/40"
									}`}
								/>
								Available for hire
							</button>

							<label className="flex items-center gap-2 border-b border-border pb-1">
								<span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
									Country
								</span>

								<input
									value={country}
									onChange={(event) =>
										setCountry(event.target.value.toUpperCase().slice(0, 2))
									}
									placeholder="ALL"
									aria-label="Country code"
									className="w-10 bg-transparent text-center font-mono text-[10px] uppercase text-foreground placeholder:text-muted-foreground focus:outline-none"
								/>
							</label>
						</div>
					</div>
				</div>

				<div className="mt-10 flex items-end justify-between border-b border-border pb-3">
					<p className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
						Developers
					</p>

					<p className="font-mono text-[10px] tabular-nums text-muted-foreground">
						{results.length.toString().padStart(2, "0")}
					</p>
				</div>

				<div>
					{results.length === 0 && !isFetching ? (
						<div className="border-b border-border py-14">
							<p className="font-display text-2xl tracking-[-0.02em]">
								No developers found.
							</p>

							<p className="mt-2 text-sm text-muted-foreground">
								Try changing your search or removing some filters.
							</p>
						</div>
					) : (
						results.map((profile, index) => (
							<ProfileRow key={profile.id} profile={profile} index={index} />
						))
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
}: {
	profile: DiscoverResult;
	index: number;
}) {
	return (
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
							{p.country}
						</p>
					)}

					{p.location && (
						<p className="mt-1 max-w-32 truncate text-xs text-muted-foreground">
							{p.location}
						</p>
					)}
				</div>

				<span className="font-mono text-xs text-muted-foreground transition-all duration-200 group-hover:translate-x-1 group-hover:text-brand">
					↗
				</span>
			</div>
		</Link>
	);
}
