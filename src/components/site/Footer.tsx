import { Link } from "@tanstack/react-router";

export function Footer() {
	return (
		<footer className="border-t border-hairline bg-surface/40">
			<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
				<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
					<div className="col-span-2">
						<Link to="/" className="font-semibold tracking-tight">
							DevLinks
						</Link>
						<p className="mt-2 max-w-xs text-sm text-muted-foreground">
							The link-in-bio built for developers. Your profile, repos,
							snippets and writing — in one place.
						</p>
					</div>
					<FooterCol
						title="Product"
						items={[
							{ label: "Features", href: "/#features" },
							{ label: "Pricing", href: "/#pricing" },
							{ label: "Examples", href: "/#examples" },
							{ label: "Discover", href: "/discover" },
						]}
					/>
					<FooterCol
						title="Company"
						items={[
							{ label: "GitHub", href: "https://github.com" },
							{ label: "Twitter", href: "https://twitter.com" },
							{ label: "Changelog", href: "#" },
							{ label: "Privacy", href: "#" },
						]}
					/>
				</div>
				<div className="mt-10 flex flex-col items-start justify-between gap-2 border-t border-hairline pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
					<p>© {new Date().getFullYear()} DevLinks. Built for developers.</p>
					<p className="font-mono">v0.1.0</p>
				</div>
			</div>
		</footer>
	);
}

function FooterCol({
	title,
	items,
}: {
	title: string;
	items: { label: string; href: string }[];
}) {
	return (
		<div>
			<h4 className="text-sm font-medium">{title}</h4>
			<ul className="mt-3 space-y-2">
				{items.map((i) => (
					<li key={i.label}>
						<a
							href={i.href}
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							{i.label}
						</a>
					</li>
				))}
			</ul>
		</div>
	);
}
