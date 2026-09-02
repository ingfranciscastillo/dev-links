import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	HeadContent,
	Link,
	ScriptOnce,
	Scripts,
	useRouter,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Toaster } from "react-hot-toast";
import { noFlashThemeScript } from "#/lib/theme";
import { absoluteUrl } from "@/lib/site";
import PostHogProvider from "../integrations/posthog/provider";
import TanStackQueryDevtools from "../integrations/tanstack-query/devtools";
import appCss from "../styles.css?url";

function NotFoundComponent() {
	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4">
			<div className="max-w-md text-center">
				<p className="font-mono text-xs uppercase tracking-widest text-brand">
					404
				</p>
				<h1 className="mt-3 text-4xl font-semibold tracking-tight">
					Page not found
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					The page you're looking for doesn't exist or has been moved.
				</p>
				<div className="mt-6">
					<Link
						to="/"
						className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
					>
						Go home
					</Link>
				</div>
			</div>
		</div>
	);
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
	console.error(error);
	const router = useRouter();

	return (
		<div className="flex min-h-dvh items-center justify-center bg-background px-4">
			<div className="max-w-md text-center">
				<h1 className="text-xl font-semibold tracking-tight text-foreground">
					This page didn't load
				</h1>
				<p className="mt-2 text-sm text-muted-foreground">
					Something went wrong on our end. Try refreshing or head back home.
				</p>
				<div className="mt-6 flex flex-wrap justify-center gap-2">
					<button
						type="button"
						onClick={() => {
							router.invalidate();
							reset();
						}}
						className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
					>
						Try again
					</button>
					<a
						href="/"
						className="inline-flex items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-elevated"
					>
						Go home
					</a>
				</div>
			</div>
		</div>
	);
}

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "DevLinks — The link-in-bio built for developers" },
			{
				name: "description",
				content:
					"One page for your repos, snippets, articles and projects. Auto-synced with GitHub, Dev.to, Hashnode, Medium and Stack Overflow.",
			},
			{ name: "author", content: "DevLinks" },
			{ name: "robots", content: "index, follow" },
			{ property: "og:site_name", content: "DevLinks" },
			{ property: "og:type", content: "website" },
			{ property: "og:image", content: absoluteUrl("/og-image-1200x630.png") },
			{ property: "og:image:width", content: "1200" },
			{ property: "og:image:height", content: "630" },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:site", content: "@devlinks" },
			{
				name: "twitter:image",
				content: absoluteUrl("/og-image-1200x630.png"),
			},
			{
				name: "theme-color",
				content: "#f7f6f4",
				media: "(prefers-color-scheme: light)",
			},
			{
				name: "theme-color",
				content: "#0a0a0a",
				media: "(prefers-color-scheme: dark)",
			},
		],
		links: [
			{ rel: "stylesheet", href: appCss },
			{ rel: "manifest", href: "/site.webmanifest" },
			{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
			{ rel: "icon", href: "/favicon.ico", sizes: "any" },
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32.png",
				media: "(prefers-color-scheme: light)",
			},
			{
				rel: "icon",
				type: "image/png",
				sizes: "32x32",
				href: "/favicon-32-dark.png",
				media: "(prefers-color-scheme: dark)",
			},
			{
				rel: "apple-touch-icon",
				sizes: "180x180",
				href: "/apple-touch-icon-180.png",
			},
		],
	}),
	shellComponent: RootDocument,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<ScriptOnce>{noFlashThemeScript}</ScriptOnce>
				<HeadContent />
			</head>
			<body>
				<PostHogProvider>
					{children}
					<Toaster
						position="bottom-right"
						toastOptions={{
							style: {
								background: "var(--color-surface)",
								color: "var(--color-foreground)",
								border: "1px solid var(--color-border)",
								borderRadius: "0",
								fontFamily: "var(--font-sans)",
								fontSize: "13px",
							},
						}}
					/>
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
							TanStackQueryDevtools,
						]}
					/>
				</PostHogProvider>
				<Scripts />
			</body>
		</html>
	);
}
