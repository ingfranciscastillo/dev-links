import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Lock, MousePointerClick, TrendingUp, Users } from "lucide-react";
import {
	Bar,
	BarChart,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import type { AnalyticsSummary } from "@/lib/api/analytics.functions";
import { useMyAnalytics } from "@/lib/queries/analytics";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
	head: () => ({ meta: [{ title: "Analytics — DevLinks" }] }),
	component: AnalyticsPage,
});

const PIE_COLORS = [
	"var(--color-brand)",
	"var(--color-foreground)",
	"var(--color-muted-foreground)",
	"var(--color-border)",
	"color-mix(in oklch, var(--color-brand) 65%, var(--color-background))",
	"color-mix(in oklch, var(--color-brand) 40%, var(--color-background))",
	"color-mix(in oklch, var(--color-brand) 20%, var(--color-background))",
];

function AnalyticsPage() {
	const { data, isLoading, isError, refetch } = useMyAnalytics();

	return (
		<div className="mx-auto w-full max-w-6xl">
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					09 / Analytics
				</p>

				<div className="mt-5">
					<h1 className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
						Analytics.
					</h1>

					<p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
						Understand how people discover and interact with your public
						DevLinks page over the last 30 days.
					</p>
				</div>
			</header>

			{isLoading ? (
				<SkeletonGrid />
			) : isError ? (
				<ErrorState onRetry={() => refetch()} />
			) : data?.plan !== "pro" ? (
				<UpgradeGate />
			) : data ? (
				<AnalyticsBody data={data} />
			) : null}
		</div>
	);
}

function SkeletonGrid() {
	return (
		<div className="mt-8 space-y-8" aria-busy="true">
			<div className="grid gap-0 border-y border-border sm:grid-cols-2 lg:grid-cols-4">
				{[0, 1, 2, 3].map((index) => (
					<div
						key={index}
						className={`h-32 animate-pulse bg-surface/40 ${
							index > 0
								? "border-t border-border sm:border-l sm:border-t-0"
								: ""
						}`}
					/>
				))}
			</div>

			<div className="h-80 animate-pulse border-y border-border bg-surface/40" />

			<div className="grid gap-8 lg:grid-cols-2">
				{[0, 1, 2, 3].map((index) => (
					<div
						key={index}
						className="h-56 animate-pulse border-y border-border bg-surface/40"
					/>
				))}
			</div>
		</div>
	);
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className="mt-8 border-y border-border py-16">
			<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-destructive">
				Error
			</p>

			<h2 className="mt-4 font-display text-3xl tracking-[-0.03em]">
				Couldn&apos;t load your analytics.
			</h2>

			<p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
				Something went wrong while fetching your stats. Please try again.
			</p>

			<Button
				variant="outline"
				onClick={onRetry}
				className="mt-6 h-9 rounded-none border-border px-4 font-mono text-[10px] uppercase tracking-[0.08em]"
			>
				Retry
			</Button>
		</div>
	);
}

function UpgradeGate() {
	return (
		<div className="mt-8 border-y border-border py-16">
			<div className="flex items-start gap-5">
				<div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center border border-border text-brand">
					<Lock className="h-4 w-4" strokeWidth={1.5} />
				</div>

				<div className="max-w-2xl">
					<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
						Pro feature
					</p>

					<h2 className="mt-4 font-display text-3xl tracking-[-0.03em] sm:text-4xl">
						Analytics is part of Pro.
					</h2>

					<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
						Unlock views, clicks, CTR, unique visitors, device, browser,
						country, referrer, and hourly activity data for your public page.
					</p>

					<Button
						asChild
						className="mt-6 h-10 rounded-none bg-foreground px-5 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
					>
						<Link to="/">Upgrade to Pro</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

function AnalyticsBody({ data }: { data: AnalyticsSummary }) {
	const {
		totals,
		daily,
		devices,
		browsers,
		os,
		countries,
		hourly,
		topLinks,
		topReferrers,
	} = data;

	const isEmpty = totals.views === 0 && totals.clicks === 0;

	return (
		<div className="mt-8">
			{isEmpty && (
				<div className="mb-8 border-y border-border py-4">
					<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
						No activity yet
					</p>

					<p className="mt-2 text-sm text-muted-foreground">
						Share your public page and your analytics will appear here as
						visitors arrive.
					</p>
				</div>
			)}

			<section className="border-y border-border" aria-label="Summary">
				<div className="grid sm:grid-cols-2 lg:grid-cols-4">
					<StatBlock
						icon={Eye}
						label="Page views"
						value={totals.views.toLocaleString()}
					/>

					<StatBlock
						icon={Users}
						label="Unique visitors"
						value={totals.uniqueVisitors.toLocaleString()}
					/>

					<StatBlock
						icon={MousePointerClick}
						label="Total clicks"
						value={totals.clicks.toLocaleString()}
					/>

					<StatBlock icon={TrendingUp} label="CTR" value={`${totals.ctr}%`} />
				</div>
			</section>

			<DataSection
				number="01"
				title="Views & clicks"
				description="Daily activity across your public page."
				className="mt-10"
			>
				<div className="h-72 w-full sm:h-80">
					<ResponsiveContainer>
						<LineChart
							data={daily}
							margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
						>
							<XAxis
								dataKey="date"
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 9,
									fill: "var(--color-muted-foreground)",
								}}
								tickFormatter={(value: string) => value.slice(5)}
							/>

							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 9,
									fill: "var(--color-muted-foreground)",
								}}
								width={35}
							/>

							<Tooltip
								contentStyle={tooltipStyle}
								cursor={{
									stroke: "var(--color-border)",
								}}
							/>

							<Line
								type="monotone"
								dataKey="views"
								stroke="var(--color-brand)"
								strokeWidth={2}
								dot={false}
								activeDot={{ r: 3 }}
							/>

							<Line
								type="monotone"
								dataKey="clicks"
								stroke="var(--color-muted-foreground)"
								strokeWidth={1.5}
								dot={false}
								activeDot={{ r: 3 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>

				<div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border pt-4 font-mono text-[9px] uppercase tracking-[0.08em] text-muted-foreground">
					<span className="inline-flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-brand" />
						Views
					</span>

					<span className="inline-flex items-center gap-2">
						<span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
						Clicks
					</span>
				</div>
			</DataSection>

			<div className="mt-10 grid gap-10 lg:grid-cols-2">
				<DataSection
					number="02"
					title="Devices"
					description="How visitors access your page."
				>
					<PieRow data={devices} />
				</DataSection>

				<DataSection
					number="03"
					title="Browsers"
					description="The browsers visitors use."
				>
					<PieRow data={browsers} />
				</DataSection>

				<DataSection
					number="04"
					title="Operating systems"
					description="Platform distribution across visitors."
				>
					<BarList data={os} />
				</DataSection>

				<DataSection
					number="05"
					title="Top countries"
					description="Where your visitors are coming from."
				>
					<BarList data={countries} />
				</DataSection>
			</div>

			<DataSection
				number="06"
				title="Hourly activity"
				description="Views grouped by hour in UTC."
				className="mt-10"
			>
				<div className="h-56 w-full sm:h-64">
					<ResponsiveContainer>
						<BarChart
							data={hourly}
							margin={{ top: 10, right: 8, left: -20, bottom: 0 }}
						>
							<XAxis
								dataKey="hour"
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 9,
									fill: "var(--color-muted-foreground)",
								}}
							/>

							<YAxis
								axisLine={false}
								tickLine={false}
								tick={{
									fontSize: 9,
									fill: "var(--color-muted-foreground)",
								}}
								width={35}
							/>

							<Tooltip
								contentStyle={tooltipStyle}
								cursor={{
									fill: "var(--color-surface)",
								}}
							/>

							<Bar dataKey="views" fill="var(--color-brand)" radius={0} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</DataSection>

			<div className="mt-10 grid gap-10 lg:grid-cols-2">
				<DataSection
					number="07"
					title="Top links"
					description="The destinations receiving the most clicks."
				>
					<RankedList
						empty="No clicks yet."
						items={topLinks.map((item) => ({
							label: item.title,
							value: item.clicks,
						}))}
					/>
				</DataSection>

				<DataSection
					number="08"
					title="Top referrers"
					description="Where visitors arrived from."
				>
					<RankedList
						empty="No referrers yet."
						items={topReferrers.map((item) => ({
							label: item.source,
							value: item.visits,
						}))}
					/>
				</DataSection>
			</div>
		</div>
	);
}

const tooltipStyle = {
	background: "var(--color-background)",
	border: "1px solid var(--color-border)",
	borderRadius: 0,
	fontSize: 11,
};

function DataSection({
	number,
	title,
	description,
	children,
	className = "",
}: {
	number: string;
	title: string;
	description?: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<section className={`border-y border-border py-7 ${className}`}>
			<header className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
				<div className="flex items-baseline gap-3">
					<span className="font-mono text-[9px] tabular-nums text-muted-foreground">
						{number}
					</span>

					<h2 className="font-display text-2xl tracking-tight sm:text-3xl">
						{title}
					</h2>
				</div>

				{description && (
					<p className="max-w-sm text-xs leading-relaxed text-muted-foreground sm:text-right">
						{description}
					</p>
				)}
			</header>

			{children}
		</section>
	);
}

function PieRow({ data }: { data: Array<{ name: string; value: number }> }) {
	if (data.length === 0) {
		return <p className="py-8 text-sm text-muted-foreground">No data yet.</p>;
	}

	return (
		<div className="flex flex-col gap-8 sm:flex-row sm:items-center">
			<div className="h-44 w-44 shrink-0">
				<ResponsiveContainer>
					<PieChart>
						<Pie
							data={data.map((item, index) => ({
								...item,
								fill: PIE_COLORS[index % PIE_COLORS.length],
							}))}
							dataKey="value"
							innerRadius={45}
							outerRadius={72}
							stroke="var(--color-background)"
							strokeWidth={2}
						/>

						<Tooltip contentStyle={tooltipStyle} />
					</PieChart>
				</ResponsiveContainer>
			</div>

			<ul className="min-w-0 flex-1 divide-y divide-border">
				{data.slice(0, 6).map((item, index) => (
					<li
						key={item.name}
						className="flex items-center justify-between gap-4 py-2.5"
					>
						<span className="flex min-w-0 items-center gap-2.5">
							<span
								className="h-1.5 w-1.5 shrink-0 rounded-full"
								style={{
									background: PIE_COLORS[index % PIE_COLORS.length],
								}}
							/>

							<span className="truncate text-xs text-muted-foreground">
								{item.name}
							</span>
						</span>

						<span className="shrink-0 font-mono text-[10px] tabular-nums">
							{item.value}
						</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function BarList({ data }: { data: Array<{ name: string; value: number }> }) {
	if (data.length === 0) {
		return <p className="py-8 text-sm text-muted-foreground">No data yet.</p>;
	}

	const max = Math.max(...data.map((item) => item.value), 1);

	return (
		<ul className="divide-y divide-border">
			{data.slice(0, 8).map((item) => (
				<li key={item.name} className="py-3">
					<div className="flex items-center justify-between gap-4 text-xs">
						<span className="min-w-0 truncate text-muted-foreground">
							{item.name}
						</span>

						<span className="shrink-0 font-mono text-[10px] tabular-nums">
							{item.value}
						</span>
					</div>

					<div className="mt-2 h-1 bg-border">
						<div
							className="h-full bg-brand"
							style={{
								width: `${(item.value / max) * 100}%`,
							}}
						/>
					</div>
				</li>
			))}
		</ul>
	);
}

function RankedList({
	items,
	empty,
}: {
	items: Array<{ label: string; value: number }>;
	empty: string;
}) {
	if (items.length === 0) {
		return <p className="py-8 text-sm text-muted-foreground">{empty}</p>;
	}

	return (
		<ol className="divide-y divide-border">
			{items.slice(0, 8).map((item, index) => (
				<li key={item.label} className="flex items-center gap-4 py-3">
					<span className="w-5 shrink-0 font-mono text-[9px] tabular-nums text-muted-foreground">
						{String(index + 1).padStart(2, "0")}
					</span>

					<span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
						{item.label}
					</span>

					<span className="shrink-0 font-mono text-[10px] tabular-nums text-foreground">
						{item.value.toLocaleString()}
					</span>
				</li>
			))}
		</ol>
	);
}

function StatBlock({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string;
}) {
	return (
		<div className="border-b border-border py-6 sm:px-6 sm:py-7 sm:first:pl-0 sm:last:pr-0 sm:border-b-0 sm:first:border-l-0 sm:not-first:border-l">
			<div className="flex items-center gap-2 text-muted-foreground">
				<Icon className="h-3.5 w-3.5" strokeWidth={1.5} />

				<p className="font-mono text-[9px] uppercase tracking-widest">
					{label}
				</p>
			</div>

			<p className="mt-4 font-display text-4xl tracking-[-0.03em] sm:text-5xl">
				{value}
			</p>
		</div>
	);
}
