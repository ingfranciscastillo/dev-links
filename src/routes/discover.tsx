import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
	type DiscoverResult,
	searchProfiles,
} from "@/lib/api/discover.functions";
import { hueFromString } from "@/lib/user";

export const Route = createFileRoute("/discover")({
	head: () => ({
		meta: [
			{ title: "Discover developers — DevLinks" },
			{
				name: "description",
				content:
					"Search developer profiles on DevLinks. Filter by language, country, technologies, seniority and availability.",
			},
			{ property: "og:title", content: "Discover developers — DevLinks" },
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
	const search = useServerFn(searchProfiles);
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
		queryFn: () => search({ data: filters }),
		placeholderData: (prev) => prev,
	});

	const results = data ?? [];

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />
			<main className="mx-auto max-w-6xl px-4 pb-24 pt-12 sm:px-6">
				<div>
					<p className="font-mono text-xs uppercase tracking-widest text-brand">
						Discover
					</p>
					<h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
						Find developers worth following.
					</h1>
					<p className="mt-2 max-w-xl text-muted-foreground">
						Full-text search across bios, tech stacks, and locations.
					</p>
				</div>

				<div className="mt-8 flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-3">
					<Search className="h-4 w-4 text-muted-foreground" />
					<input
						value={q}
						onChange={(e) => setQ(e.target.value)}
						placeholder="Search by name, bio, technologies…"
						className="h-full flex-1 bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none"
						aria-label="Search developers"
					/>
					{isFetching && (
						<span className="font-mono text-xs text-muted-foreground">…</span>
					)}
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-2">
					{LANGUAGES.map((t) => (
						<Chip
							key={t}
							active={language === t}
							onClick={() => setLanguage(language === t ? null : t)}
						>
							{t}
						</Chip>
					))}
					{SENIORITIES.map((s) => (
						<Chip
							key={s}
							active={seniority === s}
							onClick={() => setSeniority(seniority === s ? null : s)}
						>
							{s}
						</Chip>
					))}
					<Chip active={available} onClick={() => setAvailable(!available)}>
						Available for hire
					</Chip>
					<input
						value={country}
						onChange={(e) =>
							setCountry(e.target.value.toUpperCase().slice(0, 2))
						}
						placeholder="ES"
						aria-label="Country code"
						className="h-7 w-16 rounded-full border border-hairline bg-surface px-3 text-center text-xs uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
					/>
				</div>

				<div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{results.length === 0 && !isFetching && (
						<p className="col-span-full rounded-xl border border-hairline bg-surface/40 p-8 text-center text-sm text-muted-foreground">
							No developers match those filters yet.
						</p>
					)}
					{results.map((p) => (
						<ProfileCard key={p.id} profile={p} />
					))}
				</div>
			</main>
			<Footer />
		</div>
	);
}

function Chip({
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
			className={`rounded-full border px-3 py-1 text-xs transition-colors ${
				active
					? "border-brand bg-brand/10 text-brand"
					: "border-hairline bg-surface text-muted-foreground hover:text-foreground"
			}`}
		>
			{children}
		</button>
	);
}

function ProfileCard({ profile: p }: { profile: DiscoverResult }) {
	const hue = hueFromString(p.id);
	return (
		<Link
			to="/$username"
			params={{ username: p.username }}
			className="group rounded-xl border border-hairline bg-surface p-5 transition-colors hover:bg-surface-elevated"
		>
			<div className="flex items-start gap-3">
				<div
					className="h-12 w-12 shrink-0 rounded-full ring-2 ring-hairline"
					style={{
						background: `linear-gradient(135deg, oklch(0.7 0.2 ${hue}), oklch(0.45 0.18 ${hue}))`,
					}}
				/>
				<div className="min-w-0 flex-1">
					<p className="truncate font-semibold tracking-tight">
						{p.name || p.username}
					</p>
					<p className="truncate text-xs text-muted-foreground">
						@{p.username}
						{p.seniority ? ` · ${p.seniority}` : ""}
						{p.primary_language ? ` · ${p.primary_language}` : ""}
					</p>
				</div>
				{p.available && (
					<span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-500">
						<span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
						Hire
					</span>
				)}
			</div>
			{p.bio && (
				<p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
					{p.bio}
				</p>
			)}
			{p.technologies.length > 0 && (
				<div className="mt-3 flex flex-wrap gap-1">
					{p.technologies.slice(0, 5).map((t) => (
						<span
							key={t}
							className="rounded bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground"
						>
							{t}
						</span>
					))}
				</div>
			)}
			<div className="mt-4 flex items-center gap-4 border-t border-hairline pt-3 text-xs text-muted-foreground">
				{p.country && <span>{p.country}</span>}
				{p.location && <span className="truncate">{p.location}</span>}
				<span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">
					View →
				</span>
			</div>
		</Link>
	);
}
