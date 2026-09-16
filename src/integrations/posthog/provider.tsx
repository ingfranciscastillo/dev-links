import { PostHogProvider as BasePostHogProvider } from "@posthog/react";
import { useRouter } from "@tanstack/react-router";
import posthog from "posthog-js";
import { type ReactNode, useEffect } from "react";

if (typeof window !== "undefined" && import.meta.env.VITE_POSTHOG_KEY) {
	posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
		api_host: import.meta.env.VITE_POSTHOG_HOST || "https://us.i.posthog.com",
		person_profiles: "identified_only",
		capture_pageview: false,
		defaults: "2025-11-30",
		// Nothing gets captured until the cookie consent banner calls
		// posthog.opt_in_capturing() — see CookieConsentBanner.tsx.
		opt_out_capturing_by_default: true,
		// Session replay/heatmaps/dead-click tracking are on by default in
		// PostHog unless a project admin turns them off — none of this is what
		// privacy.tsx describes ("which pages get visited, which features get
		// used"), and it's how we ended up loading posthog-recorder.js and
		// dead-clicks-autocapture.js from PostHog's CDN, which load their own
		// fonts and get blocked by our font-src 'self' CSP (confirmed: those
		// two scripts stopped requesting anything once this landed).
		disable_session_recording: true,
		capture_heatmaps: false,
		capture_dead_clicks: false,
	});
}

interface PostHogProviderProps {
	children: ReactNode;
}

export default function PostHogProvider({ children }: PostHogProviderProps) {
	const router = useRouter();

	// capture_pageview: false above is correct for an SPA (PostHog's own
	// automatic pageview only fires once, on the very first document load —
	// it never sees client-side route changes) but it means WE own firing
	// pageviews from here on. This was the missing half: without this
	// listener, nothing was capturing which pages people visit at all.
	useEffect(() => {
		const unsubscribe = router.subscribe("onResolved", (event) => {
			if (!event.pathChanged) return;
			posthog.capture("$pageview", {
				$current_url: event.toLocation.href,
				path: event.toLocation.pathname,
			});
		});
		return unsubscribe;
	}, [router]);

	return <BasePostHogProvider client={posthog}>{children}</BasePostHogProvider>;
}
