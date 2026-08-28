import { Coffee, Heart, MessageCircle, Users } from "lucide-react";

function cx(...classes: Array<string | false | null | undefined>) {
	return classes.filter(Boolean).join(" ");
}

// NOTA: serverId en camelCase para coincidir con lo que envía
// getPublicProfile (profileData.supportLinks mapea r.serverId directo).
export type SupportLinkItem = {
	id: string;
	category: string;
	platform: string;
	label: string;
	url: string;
	serverId: string | null;
};

export const SUPPORT_PLATFORM_LABEL: Record<string, string> = {
	buymeacoffee: "Buy Me a Coffee",
	kofi: "Ko-fi",
	ghsponsors: "GitHub Sponsors",
	patreon: "Patreon",
	discord: "Discord",
	slack: "Slack",
};

function iconFor(platform: string) {
	if (platform === "buymeacoffee" || platform === "kofi") return Coffee;
	if (platform === "discord" || platform === "slack") return MessageCircle;
	if (platform === "ghsponsors") return Heart;
	return Users;
}

export function SupportBlock({
	links,
	themed = false,
}: {
	links: SupportLinkItem[];
	themed?: boolean;
}) {
	const support = links.filter((l) => l.category !== "community");
	if (support.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<Heart className="h-3.5 w-3.5" /> Support my work
			</h2>
			<div className="flex flex-wrap gap-2">
				{support.map((l) => {
					const Icon = iconFor(l.platform);
					return (
						<a
							key={l.id}
							href={l.url}
							target="_blank"
							rel="noreferrer"
							className={
								themed
									? "tt-btn"
									: "inline-flex items-center gap-2 rounded-xl border border-hairline bg-surface px-4 py-2.5 text-sm font-medium transition-colors hover:bg-surface-elevated"
							}
						>
							{/* Sin tema: verde de marca fijo. Con tema: hereda el color
							    de texto que ya define tt-btn según buttonStyle (solid/
							    outline/etc), vía currentColor del stroke de lucide. */}
							<Icon className={cx("h-4 w-4", !themed && "text-brand")} />
							{l.label || SUPPORT_PLATFORM_LABEL[l.platform] || l.platform}
						</a>
					);
				})}
			</div>
		</section>
	);
}

export function CommunityBlock({
	links,
	themed = false,
}: {
	links: SupportLinkItem[];
	themed?: boolean;
}) {
	const community = links.filter((l) => l.category === "community");
	if (community.length === 0) return null;
	return (
		<section>
			<h2
				className={cx(
					"mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest",
					themed ? "tt-muted" : "text-muted-foreground",
				)}
			>
				<Users className="h-3.5 w-3.5" /> Community
			</h2>
			<div className="grid gap-2 sm:grid-cols-2">
				{community.map((l) => {
					const Icon = iconFor(l.platform);
					return (
						<a
							key={l.id}
							href={l.url}
							target="_blank"
							rel="noreferrer"
							className={cx(
								"flex items-center gap-3 rounded-xl border p-4 transition-colors",
								themed
									? "tt-panel hover:opacity-90"
									: "border-hairline bg-surface hover:bg-surface-elevated",
							)}
						>
							<span
								className={cx(
									"grid h-10 w-10 place-items-center rounded-md border",
									themed ? "tt-panel" : "border-hairline bg-background",
								)}
							>
								<Icon className="h-4 w-4" />
							</span>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium">
									{l.label || SUPPORT_PLATFORM_LABEL[l.platform] || l.platform}
								</p>
								<p
									className={cx(
										"text-xs",
										themed ? "tt-muted" : "text-muted-foreground",
									)}
								>
									Join the community
								</p>
							</div>
						</a>
					);
				})}
			</div>
		</section>
	);
}
