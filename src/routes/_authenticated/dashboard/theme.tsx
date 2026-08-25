import { CheckCircleIcon } from "@solar-icons/react/line-duotone";
import {
	CodeIcon,
	LayersMinimalisticIcon,
	MagicWand3Icon,
	Palette2Icon,
	RestartIcon,
	TextFormatIcon,
	Widget4Icon,
} from "@solar-icons/react/linear";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
	useApplyThemeTemplate,
	useProfileCore,
	useProfileData,
	useResetTheme,
	useUpdateTheme,
} from "@/lib/queries/profile-data";
import { fontOptions, type ThemeV2, themeToStyleTag } from "@/lib/theme-config";
import { templates } from "@/lib/theme-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/theme")({
	head: () => ({ meta: [{ title: "Theme — DevLinks" }] }),
	component: ThemePage,
});

type Tab = "templates" | "colors" | "type" | "layout" | "effects" | "css";

function ThemePage() {
	const { user } = useRouteContext({ from: "/_authenticated/dashboard" });
	const data = useProfileData();
	const core = useProfileCore();
	const updateTheme = useUpdateTheme();
	const applyTemplate = useApplyThemeTemplate();
	const resetTheme = useResetTheme();
	const [tab, setTab] = useState<Tab>("templates");

	const theme = data.theme;
	const bio = core.data?.bio ?? "";

	const set = (patch: Partial<ThemeV2>) => {
		updateTheme.mutate(patch, {
			onError: (err) =>
				toast.error(err instanceof Error ? err.message : "Couldn't save"),
		});
	};

	return (
		<>
			<SectionHeader
				eyebrow="Appearance"
				title="Theme builder"
				description="Design your public page. Every change previews live and is saved as you go."
				action={
					<Button
						variant="ghost"
						onClick={() => {
							resetTheme.mutate(undefined, {
								onSuccess: () => toast.success("Theme reset"),
								onError: (err) =>
									toast.error(
										err instanceof Error ? err.message : "Couldn't reset",
									),
							});
						}}
					>
						<RestartIcon size={16} /> Reset
					</Button>
				}
			/>

			<div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
				<div className="space-y-4">
					<div className="flex flex-wrap gap-1 rounded-lg border border-hairline bg-surface/40 p-1">
						<TabBtn
							active={tab === "templates"}
							onClick={() => setTab("templates")}
							icon={<LayersMinimalisticIcon className="h-3.5 w-3.5" />}
						>
							Templates
						</TabBtn>
						<TabBtn
							active={tab === "colors"}
							onClick={() => setTab("colors")}
							icon={<Palette2Icon className="h-3.5 w-3.5" />}
						>
							Colors
						</TabBtn>
						<TabBtn
							active={tab === "type"}
							onClick={() => setTab("type")}
							icon={<TextFormatIcon className="h-3.5 w-3.5" />}
						>
							Type
						</TabBtn>
						<TabBtn
							active={tab === "layout"}
							onClick={() => setTab("layout")}
							icon={<Widget4Icon className="h-3.5 w-3.5" />}
						>
							Layout
						</TabBtn>
						<TabBtn
							active={tab === "effects"}
							onClick={() => setTab("effects")}
							icon={<MagicWand3Icon className="h-3.5 w-3.5" />}
						>
							Effects
						</TabBtn>
						<TabBtn
							active={tab === "css"}
							onClick={() => setTab("css")}
							icon={<CodeIcon className="h-3.5 w-3.5" />}
						>
							CSS
						</TabBtn>
					</div>

					{tab === "templates" && (
						<TemplatesPane
							currentTemplateId={data.templateId}
							onApply={(templateId) =>
								applyTemplate.mutate(templateId, {
									onSuccess: () => toast.success("Template applied"),
									onError: (err) =>
										toast.error(
											err instanceof Error ? err.message : "Couldn't apply",
										),
								})
							}
						/>
					)}
					{tab === "colors" && <ColorsPane theme={theme} set={set} />}
					{tab === "type" && <TypePane theme={theme} set={set} />}
					{tab === "layout" && <LayoutPane theme={theme} set={set} />}
					{tab === "effects" && <EffectsPane theme={theme} set={set} />}
					{tab === "css" && <CssPane theme={theme} set={set} />}

					<div className="pt-2">
						<a
							href={`/${user.username ?? ""}`}
							target="_blank"
							rel="noreferrer"
							className="text-sm underline underline-offset-4 hover:text-foreground"
						>
							Open my public page →
						</a>
					</div>
				</div>

				<div className="lg:sticky lg:top-24 lg:self-start">
					<ThemePreview
						theme={theme}
						username={user.username ?? ""}
						name={user.name}
						bio={bio}
					/>
				</div>
			</div>
		</>
	);
}

function TabBtn({
	active,
	onClick,
	icon,
	children,
}: {
	active: boolean;
	onClick: () => void;
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
				active
					? "bg-surface-elevated text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{icon}
			{children}
		</button>
	);
}

function Pane({ children }: { children: React.ReactNode }) {
	return (
		<section className="space-y-5 rounded-xl border border-hairline bg-surface/40 p-5">
			{children}
		</section>
	);
}

function Row({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-baseline justify-between">
				<Label className="text-xs">{label}</Label>
				{hint && (
					<span className="text-[10px] text-muted-foreground">{hint}</span>
				)}
			</div>
			{children}
		</div>
	);
}

function ColorField({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<Row label={label}>
			<div className="flex items-center gap-2">
				<input
					type="color"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="h-9 w-12 cursor-pointer rounded-md border border-hairline bg-transparent"
					aria-label={label}
				/>
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className="max-w-32.5 font-mono text-xs"
				/>
			</div>
		</Row>
	);
}

function TemplatesPane({
	currentTemplateId,
	onApply,
}: {
	currentTemplateId: string | null;
	onApply: (templateId: string) => void;
}) {
	return (
		<Pane>
			<p className="text-xs text-muted-foreground">
				Start from a preset. You can keep tweaking after.
			</p>
			<div className="grid grid-cols-2 gap-2">
				{templates.map((tpl) => {
					const active = currentTemplateId === tpl.id;
					return (
						<button
							type="button"
							key={tpl.id}
							onClick={() => onApply(tpl.id)}
							className={cn(
								"group relative overflow-hidden rounded-lg border p-3 text-left transition-colors",
								active
									? "border-foreground"
									: "border-hairline hover:border-border",
							)}
							style={{ background: tpl.config.bg, color: tpl.config.fg }}
						>
							<div className="flex items-center justify-between">
								<span className="text-sm font-medium">{tpl.name}</span>
								{active && <CheckCircleIcon size={14} secondaryOpacity={0} />}
							</div>
							<div className="mt-2 flex gap-1">
								<span
									className="h-4 w-4 rounded-full"
									style={{ background: tpl.config.accent }}
								/>
								<span
									className="h-4 w-4 rounded-full"
									style={{
										background: tpl.config.accent2 ?? tpl.config.accent,
									}}
								/>
								<span
									className="h-4 w-4 rounded-full border"
									style={{
										background: tpl.config.surface,
										borderColor: tpl.config.border,
									}}
								/>
							</div>
							<p className="mt-2 text-[10px] opacity-70">{tpl.description}</p>
						</button>
					);
				})}
			</div>
		</Pane>
	);
}

function ColorsPane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (p: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<div className="grid grid-cols-2 gap-3">
				<ColorField
					label="Background"
					value={theme.bg}
					onChange={(v) => set({ bg: v })}
				/>
				<ColorField
					label="Text"
					value={theme.fg}
					onChange={(v) => set({ fg: v })}
				/>
				<ColorField
					label="Muted text"
					value={theme.muted}
					onChange={(v) => set({ muted: v })}
				/>
				<ColorField
					label="Surface"
					value={theme.surface}
					onChange={(v) => set({ surface: v })}
				/>
				<ColorField
					label="Border"
					value={theme.border}
					onChange={(v) => set({ border: v })}
				/>
				<ColorField
					label="Accent"
					value={theme.accent}
					onChange={(v) => set({ accent: v })}
				/>
				<ColorField
					label="Accent 2"
					value={theme.accent2 ?? theme.accent}
					onChange={(v) => set({ accent2: v })}
				/>
			</div>
			<Row label="Background style">
				<div className="flex flex-wrap gap-1.5">
					{(
						["solid", "gradient", "radial", "mesh", "grid", "dots"] as const
					).map((s) => (
						<button
							type="button"
							key={s}
							onClick={() => set({ bgStyle: s })}
							className={cn(
								"rounded-md border px-2.5 py-1 text-xs capitalize",
								theme.bgStyle === s
									? "border-foreground"
									: "border-hairline hover:border-border",
							)}
						>
							{s}
						</button>
					))}
				</div>
			</Row>
			{theme.bgStyle === "gradient" && (
				<Row label="Gradient angle" hint={`${theme.bgAngle}°`}>
					<Slider
						value={[theme.bgAngle]}
						min={0}
						max={360}
						step={5}
						onValueChange={([v]) => set({ bgAngle: v })}
					/>
				</Row>
			)}
		</Pane>
	);
}

function TypePane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (p: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<FontPicker
				label="Heading font"
				value={theme.headingFont}
				onChange={(v) => set({ headingFont: v })}
			/>
			<FontPicker
				label="Body font"
				value={theme.bodyFont}
				onChange={(v) => set({ bodyFont: v })}
			/>
			<FontPicker
				label="Mono font"
				value={theme.monoFont}
				onChange={(v) => set({ monoFont: v })}
			/>
			<Row
				label="Font size scale"
				hint={`${Math.round(theme.fontSizeScale * 100)}%`}
			>
				<Slider
					value={[theme.fontSizeScale]}
					min={0.85}
					max={1.25}
					step={0.05}
					onValueChange={([v]) => set({ fontSizeScale: v })}
				/>
			</Row>
			<Row label="Letter spacing" hint={`${theme.letterSpacing}`}>
				<Slider
					value={[theme.letterSpacing]}
					min={-2}
					max={4}
					step={0.5}
					onValueChange={([v]) => set({ letterSpacing: v })}
				/>
			</Row>
		</Pane>
	);
}

function FontPicker({
	label,
	value,
	onChange,
}: {
	label: string;
	value: string;
	onChange: (v: string) => void;
}) {
	return (
		<Row label={label}>
			<div className="grid grid-cols-2 gap-1.5">
				{fontOptions.map((f) => (
					<button
						type="button"
						key={f.value}
						onClick={() => onChange(f.value)}
						className={cn(
							"rounded-md border px-3 py-2 text-left text-sm",
							value === f.value
								? "border-foreground"
								: "border-hairline hover:border-border",
						)}
						style={{ fontFamily: f.stack }}
					>
						{f.label}
					</button>
				))}
			</div>
		</Row>
	);
}

function LayoutPane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (p: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<Row label="Corner radius" hint={`${theme.radius}px`}>
				<Slider
					value={[theme.radius]}
					min={0}
					max={32}
					step={1}
					onValueChange={([v]) => set({ radius: v })}
				/>
			</Row>
			<Row label="Card padding" hint={`${theme.cardPadding}px`}>
				<Slider
					value={[theme.cardPadding]}
					min={8}
					max={40}
					step={1}
					onValueChange={([v]) => set({ cardPadding: v })}
				/>
			</Row>
			<Row label="Spacing scale" hint={`${theme.spacing.toFixed(2)}×`}>
				<Slider
					value={[theme.spacing]}
					min={0.75}
					max={1.5}
					step={0.05}
					onValueChange={([v]) => set({ spacing: v })}
				/>
			</Row>
			<Row label="Content width">
				<div className="flex gap-1.5">
					{(["narrow", "default", "wide"] as const).map((w) => (
						<button
							type="button"
							key={w}
							onClick={() => set({ cardWidth: w })}
							className={cn(
								"rounded-md border px-2.5 py-1 text-xs capitalize",
								theme.cardWidth === w
									? "border-foreground"
									: "border-hairline hover:border-border",
							)}
						>
							{w}
						</button>
					))}
				</div>
			</Row>
			<Row label="Button style">
				<div className="flex flex-wrap gap-1.5">
					{(["solid", "outline", "ghost", "gradient", "glass"] as const).map(
						(b) => (
							<button
								type="button"
								key={b}
								onClick={() => set({ buttonStyle: b })}
								className={cn(
									"rounded-md border px-2.5 py-1 text-xs capitalize",
									theme.buttonStyle === b
										? "border-foreground"
										: "border-hairline hover:border-border",
								)}
							>
								{b}
							</button>
						),
					)}
				</div>
			</Row>
			<Row label="Button border" hint={`${theme.buttonBorder}px`}>
				<Slider
					value={[theme.buttonBorder]}
					min={0}
					max={3}
					step={1}
					onValueChange={([v]) => set({ buttonBorder: v })}
				/>
			</Row>
		</Pane>
	);
}

function EffectsPane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (p: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<Row label="Shadow">
				<div className="flex flex-wrap gap-1.5">
					{(["none", "sm", "md", "lg", "glow"] as const).map((s) => (
						<button
							type="button"
							key={s}
							onClick={() => set({ shadow: s })}
							className={cn(
								"rounded-md border px-2.5 py-1 text-xs capitalize",
								theme.shadow === s
									? "border-foreground"
									: "border-hairline hover:border-border",
							)}
						>
							{s}
						</button>
					))}
				</div>
			</Row>
			<Row label="Hover effect">
				<div className="flex flex-wrap gap-1.5">
					{(["none", "lift", "glow", "scale", "shift"] as const).map((h) => (
						<button
							type="button"
							key={h}
							onClick={() => set({ hover: h })}
							className={cn(
								"rounded-md border px-2.5 py-1 text-xs capitalize",
								theme.hover === h
									? "border-foreground"
									: "border-hairline hover:border-border",
							)}
						>
							{h}
						</button>
					))}
				</div>
			</Row>
			<Row label="Glass on cards">
				<button
					type="button"
					onClick={() => set({ glass: !theme.glass })}
					className={cn(
						"rounded-md border px-3 py-1.5 text-xs",
						theme.glass
							? "border-foreground"
							: "border-hairline hover:border-border",
					)}
				>
					{theme.glass ? "Enabled" : "Disabled"}
				</button>
			</Row>
		</Pane>
	);
}

function CssPane({
	theme,
	set,
}: {
	theme: ThemeV2;
	set: (p: Partial<ThemeV2>) => void;
}) {
	const [draft, setDraft] = useState(theme.customCss);
	return (
		<Pane>
			<Row
				label="Custom CSS"
				hint="Applied inside a scoped block on your public page"
			>
				<Textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					rows={12}
					spellCheck={false}
					className="font-mono text-xs"
					placeholder={`.tt-card { border-width: 2px; }\n.tt-btn:hover { transform: rotate(-1deg); }`}
				/>
			</Row>
			<div className="flex gap-2">
				<Button
					size="sm"
					onClick={() => {
						set({ customCss: draft });
						toast.success("Custom CSS applied");
					}}
				>
					Apply CSS
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onClick={() => {
						setDraft("");
						set({ customCss: "" });
					}}
				>
					Clear
				</Button>
			</div>
			<p className="text-[10px] text-muted-foreground">
				Scoped selectors: <code>.tt-card</code>, <code>.tt-btn</code>,{" "}
				<code>.tt-muted</code>. Vars: <code>--tt-bg</code>, <code>--tt-fg</code>
				, <code>--tt-accent</code>, <code>--tt-radius</code>…
			</p>
		</Pane>
	);
}

function ThemePreview({
	theme,
	username,
	name,
	bio,
}: {
	theme: ThemeV2;
	username: string;
	name: string;
	bio: string;
}) {
	const styleTag = useMemo(
		() => themeToStyleTag(theme, ".tt-preview"),
		[theme],
	);
	return (
		<div className="overflow-hidden rounded-xl border border-hairline shadow-2xl">
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme styles are generated server-side from user-controlled config and scoped to .tt-preview */}
			<style dangerouslySetInnerHTML={{ __html: styleTag }} />
			<div className="tt-preview" style={{ minHeight: 520 }}>
				<div
					style={{
						padding: `calc(var(--tt-card-padding) * 1.5)`,
						maxWidth: `var(--tt-max-width)`,
						margin: "0 auto",
					}}
				>
					<div className="flex items-center gap-3">
						<div
							className="grid h-14 w-14 place-items-center rounded-full font-semibold"
							style={{ background: theme.accent, color: theme.bg }}
						>
							{name.slice(0, 1).toUpperCase()}
						</div>
						<div>
							<h1
								style={{
									fontSize: `calc(1.35rem * var(--tt-font-scale))`,
									fontWeight: 600,
									margin: 0,
								}}
							>
								{name}
							</h1>
							<p
								className="tt-muted"
								style={{
									margin: 0,
									fontSize: `calc(.85rem * var(--tt-font-scale))`,
								}}
							>
								@{username}
							</p>
						</div>
					</div>
					{bio && (
						<p
							className="tt-muted"
							style={{
								marginTop: 12,
								fontSize: `calc(.9rem * var(--tt-font-scale))`,
							}}
						>
							{bio}
						</p>
					)}

					<div
						style={{
							marginTop: 20,
							display: "grid",
							gap: `calc(.5rem * var(--tt-spacing))`,
						}}
					>
						{["My portfolio", "GitHub", "Latest blog post"].map((label) => (
							<button
								type="button"
								key={label}
								className="tt-btn"
								onClick={(e) => e.preventDefault()}
							>
								<span style={{ opacity: 0.8 }}>→</span>
								<span style={{ flex: 1 }}>{label}</span>
							</button>
						))}
					</div>

					<div
						style={{
							marginTop: 20,
							display: "grid",
							gap: `calc(.5rem * var(--tt-spacing))`,
							gridTemplateColumns: "1fr 1fr",
						}}
					>
						<div className="tt-card">
							<p style={{ fontWeight: 600, margin: 0 }}>Sample project</p>
							<p
								className="tt-muted"
								style={{ margin: "4px 0 0", fontSize: ".8rem" }}
							>
								An example card so you can feel the theme.
							</p>
						</div>
						<div className="tt-card">
							<p style={{ fontWeight: 600, margin: 0 }}>Another card</p>
							<p
								className="tt-muted"
								style={{ margin: "4px 0 0", fontSize: ".8rem" }}
							>
								Hover me to test the effect.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
