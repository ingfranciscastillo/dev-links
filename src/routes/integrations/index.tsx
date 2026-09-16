import { ArrowRightIcon } from "@solar-icons/react/linear";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getIntegrationSeo, SEO_PROVIDERS } from "@/lib/integrations/seo-content";
import { PROVIDER_LABEL, PROVIDER_SEGMENT, SEGMENT_LABEL } from "@/lib/integrations/types";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/integrations/")({
	head: () => ({
		meta: [
			{ title: "Integrations — DevLinks" },
			{
				name: "description",
				content:
					"Everything DevLinks syncs automatically: GitHub, Dev.to, Medium, Stack Overflow, LeetCode, and more.",
			},
		],
		links: [{ rel: "canonical", href: absoluteUrl("/integrations") }],
	}),
	component: IntegrationsIndex,
});

function IntegrationsIndex() {
	const bySegment = new Map<string, typeof SEO_PROVIDERS>();
	for (const provider of SEO_PROVIDERS) {
		const segment = PROVIDER_SEGMENT[provider];
		const list = bySegment.get(segment) ?? [];
		list.push(provider);
		bySegment.set(segment, list);
	}

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Integrations
				</p>

				<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Connect everything you already use.
				</h1>

				<p className="mt-6 max-w-lg text-sm leading-relaxed text-muted-foreground">
					No manual re-entry. Connect an account once and DevLinks keeps that
					part of your profile current in the background.
				</p>

				<div className="mt-16 space-y-14">
					{Array.from(bySegment.entries()).map(([segment, providers]) => (
						<div key={segment}>
							<h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
								{SEGMENT_LABEL[segment as keyof typeof SEGMENT_LABEL]}
							</h2>

							<div className="mt-4 border-t border-border">
								{providers.map((provider) => {
									const seo = getIntegrationSeo(provider);
									if (!seo) return null;
									return (
										<Link
											key={provider}
											to="/integrations/$provider"
											params={{ provider }}
											className="group flex items-center justify-between gap-4 border-b border-border py-5 transition-colors hover:bg-surface"
										>
											<div>
												<h3 className="font-display text-xl tracking-tight sm:text-2xl">
													{PROVIDER_LABEL[provider]}
												</h3>
												<p className="mt-1 max-w-md text-sm text-muted-foreground">
													{seo.tagline}
												</p>
											</div>
											<ArrowRightIcon
												size={16}
												className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand"
											/>
										</Link>
									);
								})}
							</div>
						</div>
					))}
				</div>
			</main>

			<Footer />
		</div>
	);
}
