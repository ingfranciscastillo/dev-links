import { ArrowRightIcon } from "@solar-icons/react/linear";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BLOG_POSTS } from "@/content/blog/posts";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/blog/")({
	head: () => ({
		meta: [
			{ title: "Blog — DevLinks" },
			{
				name: "description",
				content:
					"Notes on building DevLinks, presenting a developer profile well, and staying visible in a job search.",
			},
		],
		links: [{ rel: "canonical", href: absoluteUrl("/blog") }],
	}),
	component: BlogIndex,
});

function BlogIndex() {
	const posts = [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Blog
				</p>

				<h1 className="mt-6 max-w-2xl font-display text-5xl leading-[0.95] tracking-[-0.04em] sm:text-6xl">
					Notes on building DevLinks.
				</h1>

				<div className="mt-16 border-t border-border">
					{posts.map((post) => (
						<Link
							key={post.slug}
							to="/blog/$slug"
							params={{ slug: post.slug }}
							className="group flex items-center justify-between gap-4 border-b border-border py-7 transition-colors hover:bg-surface"
						>
							<div>
								<p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
									{post.date}
								</p>
								<h2 className="mt-2 font-display text-2xl tracking-tight sm:text-3xl">
									{post.title}
								</h2>
								<p className="mt-2 max-w-xl text-sm text-muted-foreground">
									{post.description}
								</p>
							</div>
							<ArrowRightIcon
								size={18}
								className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-brand"
							/>
						</Link>
					))}
				</div>
			</main>

			<Footer />
		</div>
	);
}
