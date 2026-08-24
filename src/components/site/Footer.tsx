import { LinkRoundIcon } from "@solar-icons/react/linear/link-round";

export function Footer() {
	return (
		<footer className="border-t border-hairline">
			<div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
				<div className="flex items-center gap-2">
					<LinkRoundIcon size={12} />
					<span>DevLinks</span>
				</div>
				<p className="font-mono text-xs">
					© {new Date().getFullYear()} DevLinks
				</p>
			</div>
		</footer>
	);
}
