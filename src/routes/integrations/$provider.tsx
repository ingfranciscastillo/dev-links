import { ArrowRightIcon, UnreadIcon } from "@solar-icons/react/linear";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getIntegrationSeo, SEO_PROVIDERS } from "@/lib/integrations/seo-content";
import { PROVIDER_LABEL, PROVIDER_SEGMENT, type Provider } from "@/lib/integrations/types";
import { absoluteUrl } from "@/lib/site";

const ease = [0.16, 1, 0.3, 1] as const;

function isSeoProvider(value: string): value is Provider {
	return (SEO_PROVIDERS as string[]).includes(value);
}

export const Route = createFileRoute("/integrations/$provider")({
	loader: ({ params }) => {
		if (!isSeoProvider(params.provider)) throw notFound();
		const seo = getIntegrationSeo(params.provider);
		if (!seo) throw notFound();
		return { provider: params.provider, seo, label: PROVIDER_LABEL[params.provider] };
	},
	head: ({ loaderData, params }) => {
		if (!loaderData) return {};
		const title = `${loaderData.label} integration — DevLinks`;
		return {
			meta: [
				{ title },
				{ name: "description", content: loaderData.seo.description },
				{ property: "og:title", content: title },
				{ property: "og:description", content: loaderData.seo.description },
			],
			links: [
				{
					rel: "canonical",
					href: absoluteUrl(`/integrations/${params.provider}`),
				},
			],
		};
	},
	notFoundComponent: () => (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4">
			<div className="text-center">
				<h1 className="text-3xl font-semibold tracking-tight">
					Integration not found
				</h1>
				<Link
					to="/integrations"
					className="mt-6 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
				>
					See all integrations
				</Link>
			</div>
		</div>
	),
	component: IntegrationPage,
});

function IntegrationPage() {
	const { provider, seo, label } = Route.useLoaderData();
	const reduceMotion = useReducedMotion();
	const related = SEO_PROVIDERS.filter(
		(p) => p !== provider && PROVIDER_SEGMENT[p] === PROVIDER_SEGMENT[provider],
	).slice(0, 4);

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<motion.div
					initial={reduceMotion ? false : { opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: reduceMotion ? 0.01 : 0.7, ease }}
				>
					<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
						Integrations
					</p>

					<h1 className="mt-6 max-w-2xl font-display text-4xl leading-[1.02] tracking-[-0.03em] sm:text-5xl">
						{label} on your DevLinks profile.
					</h1>

					<p className="mt-6 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
						{seo.tagline}
					</p>

					<p className="mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground">
						{seo.description}
					</p>
				</motion.div>

				<motion.div
					className="mt-16 border-t border-border pt-10"
					initial={reduceMotion ? false : { opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, amount: 0.3 }}
					transition={{ duration: reduceMotion ? 0.01 : 0.5, ease }}
				>
					<h2 className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
						What syncs
					</h2>

					<ul className="mt-5 space-y-3">
						{seo.syncs.map((item) => (
							<li key={item} className="flex items-start gap-3 text-sm">
								<UnreadIcon size={16} className="mt-0.5 shrink-0 text-brand" />
								<span>{item}</span>
							</li>
						))}
					</ul>
				</motion.div>

				<div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-border pt-10">
					<a
						href="/#cta"
						className="group inline-flex items-center gap-2 border border-foreground px-5 py-3 font-mono text-[11px] uppercase tracking-[0.08em] text-foreground transition-colors hover:border-brand hover:text-brand"
					>
						Claim your profile
						<ArrowRightIcon
							size={13}
							className="transition-transform duration-300 group-hover:translate-x-1"
						/>
					</a>

					<div className="flex flex-wrap gap-4">
						{related.map((p) => (
							<Link
								key={p}
								to="/integrations/$provider"
								params={{ provider: p }}
								className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
							>
								{PROVIDER_LABEL[p]}
							</Link>
						))}
					</div>
				</div>

				<p className="mt-10">
					<Link
						to="/integrations"
						className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
					>
						← All integrations
					</Link>
				</p>
			</main>

			<Footer />
		</div>
	);
}
