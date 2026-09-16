import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getBlogPost } from "@/content/blog/posts";
import { absoluteUrl } from "@/lib/site";

export const Route = createFileRoute("/blog/$slug")({
	loader: ({ params }) => {
		const post = getBlogPost(params.slug);
		if (!post) throw notFound();
		// Loader data gets serialized (seroval) to hydrate the client — `load`
		// is a function (the dynamic import), which can't be serialized and
		// crashed hydration ("Seroval Error: parseFunction") when the whole
		// post object was returned here. Strip it; the component re-derives
		// it from the static BLOG_POSTS array instead, which needs no
		// serialization at all.
		const { load: _load, ...meta } = post;
		return meta;
	},
	head: ({ loaderData, params }) => {
		if (!loaderData) return {};
		const title = `${loaderData.title} — DevLinks`;
		return {
			meta: [
				{ title },
				{ name: "description", content: loaderData.description },
				{ property: "og:title", content: title },
				{ property: "og:description", content: loaderData.description },
				{ property: "article:published_time", content: loaderData.date },
			],
			links: [
				{ rel: "canonical", href: absoluteUrl(`/blog/${params.slug}`) },
			],
		};
	},
	notFoundComponent: () => (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4">
			<div className="text-center">
				<h1 className="text-3xl font-semibold tracking-tight">
					Post not found
				</h1>
				<Link
					to="/blog"
					className="mt-6 inline-flex h-10 items-center rounded-md bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
				>
					See all posts
				</Link>
			</div>
		</div>
	),
	component: BlogPostPage,
});

function BlogPostPage() {
	const post = Route.useLoaderData();
	const { slug } = Route.useParams();
	// Safe to assume it exists — the loader already threw notFound() otherwise.
	const MDXContent = lazy(() => getBlogPost(slug)!.load());

	return (
		<div className="min-h-dvh bg-background text-foreground">
			<Header />

			<main className="mx-auto max-w-editorial px-5 py-24 sm:px-8 sm:py-32">
				<p className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand">
					Blog
				</p>

				<p className="mt-6 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
					{post.date}
				</p>

				<h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.05] tracking-[-0.03em] sm:text-5xl">
					{post.title}
				</h1>

				<div
					className={[
						"prose prose-neutral dark:prose-invert mt-14 max-w-2xl",
						"prose-headings:font-display prose-headings:tracking-[-0.02em]",
						"prose-a:text-brand prose-a:no-underline hover:prose-a:underline",
						"prose-p:leading-relaxed prose-p:text-muted-foreground",
					].join(" ")}
				>
					<Suspense fallback={<p>Loading…</p>}>
						<MDXContent />
					</Suspense>
				</div>

				<p className="mt-16 border-t border-border pt-10">
					<Link
						to="/blog"
						className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground transition-colors hover:text-foreground"
					>
						← All posts
					</Link>
				</p>
			</main>

			<Footer />
		</div>
	);
}
