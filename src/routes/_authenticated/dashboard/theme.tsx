import { CheckCircleIcon } from "@solar-icons/react/line-duotone";
import { LockKeyholeIcon, RestartIcon } from "@solar-icons/react/linear";
import { createFileRoute, useRouteContext } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { startProCheckout } from "@/lib/billing";
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
	const isPro = core.data?.plan === "pro";

	const set = (patch: Partial<ThemeV2>) => {
		updateTheme.mutate(patch, {
			onError: (err) =>
				toast.error(err instanceof Error ? err.message : "Couldn't save"),
		});
	};

	return (
		<div className="mx-auto w-full max-w-350">
			<header className="border-b border-border pb-8">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					08 / Theme
				</p>

				<div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
					<div className="min-w-0">
						<h1 className="font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
							Theme.
						</h1>

						<p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
							Design your public page. Changes are previewed live and saved
							automatically.
						</p>
					</div>

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
						className="h-9 self-start rounded-none px-2 font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground hover:bg-transparent hover:text-foreground lg:self-auto"
					>
						<RestartIcon size={14} />
						Reset
					</Button>
				</div>
			</header>

			<div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(24rem,0.85fr)] xl:gap-14">
				<div className="min-w-0">
					<nav
						className="grid min-w-0 grid-cols-6 border-b border-border"
						aria-label="Theme sections"
					>
						{(
							[
								["templates", "Templates"],
								["colors", "Colors"],
								["type", "Type"],
								["layout", "Layout"],
								["effects", "Effects"],
								["css", "CSS"],
							] as const
						).map(([value, label]) => (
							<TabBtn
								key={value}
								active={tab === value}
								onClick={() => setTab(value)}
							>
								{label}
							</TabBtn>
						))}
					</nav>

					<div className="pt-8">
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

						{tab === "css" && <CssPane theme={theme} set={set} isPro={isPro} />}
					</div>

					<div className="mt-8 border-t border-border pt-5">
						<a
							href={`/${user.username ?? ""}`}
							target="_blank"
							rel="noreferrer"
							className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground hover:decoration-brand"
						>
							Open my public page ↗
						</a>
					</div>
				</div>

				<div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
					<div className="mb-4 flex items-center justify-between border-b border-border pb-3">
						<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
							Live preview
						</p>

						<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
							/{user.username ?? "preview"}
						</p>
					</div>

					<ThemePreview
						theme={theme}
						username={user.username ?? ""}
						name={user.name}
						bio={bio}
					/>
				</div>
			</div>
		</div>
	);
}

function TabBtn({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"relative min-w-0 whitespace-nowrap overflow-hidden px-0.5 pb-3 font-mono text-[8px] uppercase tracking-[0.02em] transition-colors sm:px-1 sm:text-[10px] sm:tracking-wider",
				active
					? "text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}

			{active && <span className="absolute inset-x-0 bottom-0 h-px bg-brand" />}
		</button>
	);
}

function Pane({ children }: { children: React.ReactNode }) {
	return <section className="min-w-0 space-y-7">{children}</section>;
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
		<div className="min-w-0 border-b border-border pb-6">
			<div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
				<Label className="font-mono text-[10px] uppercase tracking-[0.08em]">
					{label}
				</Label>

				{hint && (
					<span className="font-mono text-[9px] text-muted-foreground">
						{hint}
					</span>
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
	onChange: (value: string) => void;
}) {
	return (
		<Row label={label}>
			<div className="flex min-w-0 items-center gap-3">
				<input
					type="color"
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="h-10 w-12 shrink-0 cursor-pointer rounded-none border border-border bg-background p-1"
					aria-label={label}
				/>

				<Input
					value={value}
					onChange={(event) => onChange(event.target.value)}
					className="h-10 min-w-0 flex-1 rounded-none border-x-0 border-t-0 border-b-border bg-transparent px-0 font-mono text-xs shadow-none focus-visible:border-brand focus-visible:ring-0"
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
			<div>
				<p className="font-display text-2xl tracking-tight">
					Start with a direction.
				</p>

				<p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
					Choose a preset, then continue shaping every detail to your taste.
				</p>
			</div>

			<div className="grid gap-px border border-border bg-border sm:grid-cols-2">
				{templates.map((template) => {
					const active = currentTemplateId === template.id;

					return (
						<button
							type="button"
							key={template.id}
							onClick={() => onApply(template.id)}
							className={cn(
								"group relative min-w-0 border-0 p-5 text-left transition-all",
								active
									? "ring-1 ring-inset ring-foreground"
									: "hover:opacity-85",
							)}
							style={{
								background: template.config.bg,
								color: template.config.fg,
							}}
						>
							<div className="flex min-w-0 items-start justify-between gap-4">
								<div className="min-w-0">
									<p className="truncate font-display text-xl tracking-tight">
										{template.name}
									</p>

									<p className="mt-2 max-w-sm text-xs leading-relaxed opacity-70">
										{template.description}
									</p>
								</div>

								{active && (
									<CheckCircleIcon
										size={25}
										secondaryOpacity={0}
										className="shrink-0"
									/>
								)}
							</div>

							<div className="mt-5 flex gap-1.5">
								<span
									className="h-4 w-4 rounded-full"
									style={{ background: template.config.accent }}
								/>

								<span
									className="h-4 w-4 rounded-full"
									style={{
										background:
											template.config.accent2 ?? template.config.accent,
									}}
								/>

								<span
									className="h-4 w-4 rounded-full border"
									style={{
										background: template.config.surface,
										borderColor: template.config.border,
									}}
								/>
							</div>
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
	set: (patch: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<div className="grid gap-6 sm:grid-cols-2">
				<ColorField
					label="Background"
					value={theme.bg}
					onChange={(value) => set({ bg: value })}
				/>

				<ColorField
					label="Text"
					value={theme.fg}
					onChange={(value) => set({ fg: value })}
				/>

				<ColorField
					label="Muted text"
					value={theme.muted}
					onChange={(value) => set({ muted: value })}
				/>

				<ColorField
					label="Surface"
					value={theme.surface}
					onChange={(value) => set({ surface: value })}
				/>

				<ColorField
					label="Border"
					value={theme.border}
					onChange={(value) => set({ border: value })}
				/>

				<ColorField
					label="Accent"
					value={theme.accent}
					onChange={(value) => set({ accent: value })}
				/>

				<ColorField
					label="Accent 2"
					value={theme.accent2 ?? theme.accent}
					onChange={(value) => set({ accent2: value })}
				/>
			</div>

			<Row label="Background style">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(
						["solid", "gradient", "radial", "mesh", "grid", "dots"] as const
					).map((style) => (
						<ChoiceButton
							key={style}
							active={theme.bgStyle === style}
							onClick={() => set({ bgStyle: style })}
						>
							{style}
						</ChoiceButton>
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
						onValueChange={([value]) => set({ bgAngle: value })}
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
	set: (patch: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<FontPicker
				label="Heading font"
				value={theme.headingFont}
				onChange={(value) => set({ headingFont: value })}
			/>

			<FontPicker
				label="Body font"
				value={theme.bodyFont}
				onChange={(value) => set({ bodyFont: value })}
			/>

			<FontPicker
				label="Mono font"
				value={theme.monoFont}
				onChange={(value) => set({ monoFont: value })}
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
					onValueChange={([value]) => set({ fontSizeScale: value })}
				/>
			</Row>

			<Row label="Letter spacing" hint={`${theme.letterSpacing}`}>
				<Slider
					value={[theme.letterSpacing]}
					min={-2}
					max={4}
					step={0.5}
					onValueChange={([value]) => set({ letterSpacing: value })}
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
	onChange: (value: string) => void;
}) {
	return (
		<Row label={label}>
			<div className="grid gap-px border border-border bg-border sm:grid-cols-2">
				{fontOptions.map((font) => (
					<button
						type="button"
						key={font.value}
						onClick={() => onChange(font.value)}
						className={cn(
							"min-w-0 border-0 bg-background px-4 py-3 text-left transition-colors",
							value === font.value
								? "bg-surface-elevated text-foreground"
								: "text-muted-foreground hover:text-foreground",
						)}
						style={{ fontFamily: font.stack }}
					>
						<span className="block truncate text-sm">{font.label}</span>

						<span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.08em] text-muted-foreground">
							{font.value}
						</span>
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
	set: (patch: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<Row label="Corner radius" hint={`${theme.radius}px`}>
				<Slider
					value={[theme.radius]}
					min={0}
					max={32}
					step={1}
					onValueChange={([value]) => set({ radius: value })}
				/>
			</Row>

			<Row label="Card padding" hint={`${theme.cardPadding}px`}>
				<Slider
					value={[theme.cardPadding]}
					min={8}
					max={40}
					step={1}
					onValueChange={([value]) => set({ cardPadding: value })}
				/>
			</Row>

			<Row label="Spacing scale" hint={`${theme.spacing.toFixed(2)}×`}>
				<Slider
					value={[theme.spacing]}
					min={0.75}
					max={1.5}
					step={0.05}
					onValueChange={([value]) => set({ spacing: value })}
				/>
			</Row>

			<Row label="Content width">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(["narrow", "default", "wide"] as const).map((width) => (
						<ChoiceButton
							key={width}
							active={theme.cardWidth === width}
							onClick={() => set({ cardWidth: width })}
						>
							{width}
						</ChoiceButton>
					))}
				</div>
			</Row>

			<Row label="Button style">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(["solid", "outline", "ghost", "gradient", "glass"] as const).map(
						(style) => (
							<ChoiceButton
								key={style}
								active={theme.buttonStyle === style}
								onClick={() => set({ buttonStyle: style })}
							>
								{style}
							</ChoiceButton>
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
					onValueChange={([value]) => set({ buttonBorder: value })}
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
	set: (patch: Partial<ThemeV2>) => void;
}) {
	return (
		<Pane>
			<Row label="Shadow">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(["none", "sm", "md", "lg", "glow"] as const).map((shadow) => (
						<ChoiceButton
							key={shadow}
							active={theme.shadow === shadow}
							onClick={() => set({ shadow })}
						>
							{shadow}
						</ChoiceButton>
					))}
				</div>
			</Row>

			<Row label="Hover effect">
				<div className="flex flex-wrap gap-x-5 gap-y-3">
					{(["none", "lift", "glow", "scale", "shift"] as const).map(
						(hover) => (
							<ChoiceButton
								key={hover}
								active={theme.hover === hover}
								onClick={() => set({ hover })}
							>
								{hover}
							</ChoiceButton>
						),
					)}
				</div>
			</Row>

			<Row label="Glass on cards">
				<button
					type="button"
					onClick={() => set({ glass: !theme.glass })}
					className={cn(
						"font-mono text-[10px] uppercase tracking-[0.08em] transition-colors",
						theme.glass
							? "text-brand"
							: "text-muted-foreground hover:text-foreground",
					)}
				>
					{theme.glass ? "/ Enabled" : "Disabled"}
				</button>
			</Row>
		</Pane>
	);
}

function ChoiceButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"font-mono text-[10px] uppercase tracking-wider transition-colors",
				active ? "text-brand" : "text-muted-foreground hover:text-foreground",
			)}
		>
			{active && <span className="mr-1.5">/</span>}
			{children}
		</button>
	);
}

function CssPane({
	theme,
	set,
	isPro,
}: {
	theme: ThemeV2;
	set: (patch: Partial<ThemeV2>) => void;
	isPro: boolean;
}) {
	const [draft, setDraft] = useState(theme.customCss);

	async function handleUpgrade() {
		try {
			await startProCheckout();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Couldn't start checkout",
			);
		}
	}

	if (!isPro) {
		return (
			<Pane>
				<div className="flex items-start gap-4 border-b border-border pb-8">
					<div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center border border-border text-brand">
						<LockKeyholeIcon className="h-4 w-4" strokeWidth={1.5} />
					</div>

					<div>
						<p className="font-mono text-[9px] uppercase tracking-[0.12em] text-brand">
							Pro feature
						</p>

						<h3 className="mt-3 font-display text-2xl tracking-[-0.03em]">
							Custom CSS is part of Pro.
						</h3>

						<p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
							Write your own CSS, scoped to your public page, for full control
							over how it looks.
						</p>

						<Button
							onClick={handleUpgrade}
							className="mt-5 h-9 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
						>
							Upgrade to Pro
						</Button>
					</div>
				</div>
			</Pane>
		);
	}

	return (
		<Pane>
			<Row
				label="Custom CSS"
				hint="Applied inside a scoped block on your public page"
			>
				<Textarea
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					rows={14}
					spellCheck={false}
					className="resize-none rounded-none border-border bg-surface font-mono text-xs leading-relaxed shadow-none focus-visible:border-brand focus-visible:ring-0"
					placeholder={`.tt-card { border-width: 2px; }\n.tt-btn:hover { transform: rotate(-1deg); }`}
				/>
			</Row>

			<div className="flex flex-wrap gap-5">
				<Button
					size="sm"
					onClick={() => {
						set({ customCss: draft });
						toast.success("Custom CSS applied");
					}}
					className="h-9 rounded-none bg-foreground px-4 font-mono text-[10px] uppercase tracking-[0.08em] text-background shadow-none hover:bg-brand hover:text-brand-foreground"
				>
					Apply CSS
				</Button>

				<button
					type="button"
					onClick={() => {
						setDraft("");
						set({ customCss: "" });
					}}
					className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
				>
					Clear
				</button>
			</div>

			<p className="text-[10px] leading-relaxed text-muted-foreground">
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
		<div className="min-w-0 overflow-hidden border border-border bg-background">
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme styles are generated server-side from user-controlled config and scoped to .tt-preview */}
			<style dangerouslySetInnerHTML={{ __html: styleTag }} />

			<div
				className="tt-preview min-h-130 overflow-auto"
				style={{ minHeight: 520 }}
			>
				<div
					style={{
						padding: `calc(var(--tt-card-padding) * 1.5)`,
						maxWidth: "var(--tt-max-width)",
						margin: "0 auto",
					}}
				>
					<div className="flex items-center gap-3">
						<div
							className="grid h-14 w-14 shrink-0 place-items-center rounded-full font-semibold"
							style={{
								background: theme.accent,
								color: theme.bg,
							}}
						>
							{name.slice(0, 1).toUpperCase()}
						</div>

						<div className="min-w-0">
							<h1
								style={{
									fontSize: "calc(1.35rem * var(--tt-font-scale))",
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
									fontSize: "calc(.85rem * var(--tt-font-scale))",
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
								fontSize: "calc(.9rem * var(--tt-font-scale))",
							}}
						>
							{bio}
						</p>
					)}

					<div
						style={{
							marginTop: 20,
							display: "grid",
							gap: "calc(.5rem * var(--tt-spacing))",
						}}
					>
						{["My portfolio", "GitHub", "Latest blog post"].map((label) => (
							<button
								type="button"
								key={label}
								className="tt-btn"
								onClick={(event) => event.preventDefault()}
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
							gap: "calc(.5rem * var(--tt-spacing))",
							gridTemplateColumns: "1fr 1fr",
						}}
					>
						<div className="tt-card">
							<p style={{ fontWeight: 600, margin: 0 }}>Sample project</p>

							<p
								className="tt-muted"
								style={{
									margin: "4px 0 0",
									fontSize: ".8rem",
								}}
							>
								An example card so you can feel the theme.
							</p>
						</div>

						<div className="tt-card">
							<p style={{ fontWeight: 600, margin: 0 }}>Another card</p>

							<p
								className="tt-muted"
								style={{
									margin: "4px 0 0",
									fontSize: ".8rem",
								}}
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
