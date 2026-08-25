import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Lock, MousePointerClick, TrendingUp, Users } from "lucide-react";
import {
	Bar,
	BarChart,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/button";
import {
	type AnalyticsSummary,
	getMyAnalytics,
} from "@/lib/api/analytics.functions";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
	head: () => ({ meta: [{ title: "Analytics — DevLinks" }] }),
	component: AnalyticsPage,
});

const PIE_COLORS = [
	"var(--color-brand)",
	"hsl(var(--muted-foreground))",
	"#a78bfa",
	"#f472b6",
	"#34d399",
	"#f59e0b",
	"#60a5fa",
];

function AnalyticsPage() {
	const fetchAnalytics = useServerFn(getMyAnalytics);
	const { data, isLoading } = useQuery({
		queryKey: ["analytics-30d"],
		queryFn: () => fetchAnalytics(),
		staleTime: 60_000,
	});

	return (
		<DashboardShell>
			<SectionHeader
				eyebrow="Insights"
				title="Analytics"
				description="Real activity on your public page over the last 30 days."
			/>
			{isLoading ? (
				<SkeletonGrid />
			) : data?.plan !== "pro" ? (
				<UpgradeGate />
			) : data ? (
				<AnalyticsBody data={data} />
			) : null}
		</DashboardShell>
	);
}

function SkeletonGrid() {
	return (
		<div className="grid gap-4 sm:grid-cols-3">
			{[0, 1, 2].map((i) => (
				<div
					key={i}
					className="h-24 animate-pulse rounded-xl border border-hairline bg-surface/40"
				/>
			))}
		</div>
	);
}

function UpgradeGate() {
	return (
		<div className="rounded-xl border border-hairline bg-surface/40 p-10 text-center">
			<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 text-brand">
				<Lock className="h-5 w-5" />
			</div>
			<h2 className="mt-4 text-lg font-semibold">Analytics is a Pro feature</h2>
			<p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
				Upgrade to unlock views, clicks, CTR, unique visitors, device / browser
				/ country breakdowns, referrers, and hourly heatmaps for your public
				page.
			</p>
			<Button asChild className="mt-6">
				<Link to="/">Upgrade to Pro</Link>
			</Button>
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
		<>
			{isEmpty && (
				<p className="mb-4 rounded-md border border-hairline bg-surface/40 px-3 py-2 text-xs text-muted-foreground">
					No data yet — share your public page and check back once visitors
					arrive.
				</p>
			)}

			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<StatCard
					icon={Eye}
					label="Page views"
					value={totals.views.toLocaleString()}
				/>
				<StatCard
					icon={Users}
					label="Unique visitors"
					value={totals.uniqueVisitors.toLocaleString()}
				/>
				<StatCard
					icon={MousePointerClick}
					label="Total clicks"
					value={totals.clicks.toLocaleString()}
				/>
				<StatCard icon={TrendingUp} label="CTR" value={`${totals.ctr}%`} />
			</div>

			<div className="mt-6 rounded-xl border border-hairline bg-surface/40 p-4">
				<p className="mb-3 text-sm font-medium">Views & clicks</p>
				<div className="h-56 w-full">
					<ResponsiveContainer>
						<LineChart data={daily}>
							<XAxis
								dataKey="date"
								tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
								tickFormatter={(v: string) => v.slice(5)}
							/>
							<YAxis
								tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
								width={30}
							/>
							<Tooltip contentStyle={tooltipStyle} />
							<Line
								type="monotone"
								dataKey="views"
								stroke="var(--color-brand)"
								strokeWidth={2}
								dot={false}
							/>
							<Line
								type="monotone"
								dataKey="clicks"
								stroke="hsl(var(--muted-foreground))"
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-2">
				<ChartCard title="Devices">
					<PieRow data={devices} />
				</ChartCard>
				<ChartCard title="Browsers">
					<PieRow data={browsers} />
				</ChartCard>
				<ChartCard title="Operating systems">
					<BarList data={os} />
				</ChartCard>
				<ChartCard title="Top countries">
					<BarList data={countries} />
				</ChartCard>
			</div>

			<div className="mt-6 rounded-xl border border-hairline bg-surface/40 p-4">
				<p className="mb-3 text-sm font-medium">Hourly views (UTC)</p>
				<div className="h-40 w-full">
					<ResponsiveContainer>
						<BarChart data={hourly}>
							<XAxis
								dataKey="hour"
								tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
							/>
							<YAxis
								tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
								width={30}
							/>
							<Tooltip contentStyle={tooltipStyle} />
							<Bar
								dataKey="views"
								fill="var(--color-brand)"
								radius={[3, 3, 0, 0]}
							/>
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>

			<div className="mt-6 grid gap-4 lg:grid-cols-2">
				<div className="rounded-xl border border-hairline bg-surface/40 p-4">
					<p className="mb-3 text-sm font-medium">Top links</p>
					{topLinks.length === 0 ? (
						<p className="text-xs text-muted-foreground">No clicks yet.</p>
					) : (
						<ul className="divide-y divide-hairline">
							{topLinks.map((r) => (
								<li
									key={r.title}
									className="flex items-center justify-between py-2 text-sm"
								>
									<span className="truncate text-muted-foreground">
										{r.title}
									</span>
									<span className="font-mono text-xs">
										{r.clicks.toLocaleString()}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
				<div className="rounded-xl border border-hairline bg-surface/40 p-4">
					<p className="mb-3 text-sm font-medium">Top referrers</p>
					{topReferrers.length === 0 ? (
						<p className="text-xs text-muted-foreground">No referrers yet.</p>
					) : (
						<ul className="divide-y divide-hairline">
							{topReferrers.map((r) => (
								<li
									key={r.source}
									className="flex items-center justify-between py-2 text-sm"
								>
									<span className="text-muted-foreground">{r.source}</span>
									<span className="font-mono text-xs">
										{r.visits.toLocaleString()}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			</div>
		</>
	);
}

const tooltipStyle = {
	background: "var(--color-surface)",
	border: "1px solid var(--color-hairline)",
	borderRadius: 8,
	fontSize: 12,
} as const;

function ChartCard({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<div className="rounded-xl border border-hairline bg-surface/40 p-4">
			<p className="mb-3 text-sm font-medium">{title}</p>
			{children}
		</div>
	);
}

function PieRow({ data }: { data: Array<{ name: string; value: number }> }) {
	if (data.length === 0)
		return <p className="text-xs text-muted-foreground">No data yet.</p>;
	return (
		<div className="flex items-center gap-3">
			<div className="h-40 w-40 shrink-0">
				<ResponsiveContainer>
					<PieChart>
						<Pie
							data={data}
							dataKey="value"
							innerRadius={35}
							outerRadius={65}
							stroke="none"
						>
							{data.map((_, i) => (
								<Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
							))}
						</Pie>
						<Tooltip contentStyle={tooltipStyle} />
					</PieChart>
				</ResponsiveContainer>
			</div>
			<ul className="flex-1 space-y-1 text-xs">
				{data.slice(0, 6).map((d, i) => (
					<li key={d.name} className="flex items-center justify-between gap-2">
						<span className="flex items-center gap-2 truncate">
							<span
								className="h-2 w-2 rounded-full"
								style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}
							/>
							<span className="truncate text-muted-foreground">{d.name}</span>
						</span>
						<span className="font-mono">{d.value}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

function BarList({ data }: { data: Array<{ name: string; value: number }> }) {
	if (data.length === 0)
		return <p className="text-xs text-muted-foreground">No data yet.</p>;
	const max = Math.max(...data.map((d) => d.value), 1);
	return (
		<ul className="space-y-2">
			{data.slice(0, 8).map((d) => (
				<li key={d.name}>
					<div className="flex items-center justify-between text-xs">
						<span className="truncate text-muted-foreground">{d.name}</span>
						<span className="font-mono">{d.value}</span>
					</div>
					<div className="mt-1 h-1.5 overflow-hidden rounded-full bg-hairline">
						<div
							className="h-full rounded-full bg-brand"
							style={{ width: `${(d.value / max) * 100}%` }}
						/>
					</div>
				</li>
			))}
		</ul>
	);
}

function StatCard({
	icon: Icon,
	label,
	value,
}: {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	value: string;
}) {
	return (
		<div className="rounded-xl border border-hairline bg-surface/40 p-5">
			<div className="flex items-center justify-between text-muted-foreground">
				<p className="text-sm">{label}</p>
				<Icon className="h-4 w-4" />
			</div>
			<p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
		</div>
	);
}
