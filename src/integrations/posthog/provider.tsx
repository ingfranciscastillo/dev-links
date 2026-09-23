import { PostHogProvider as BasePostHogProvider } from "@posthog/react";
import { useRouter } from "@tanstack/react-router";
import posthog, { type BeforeSendFn } from "posthog-js";
import { type ReactNode, useEffect } from "react";

// One-time secrets that can appear in a page URL (the password-reset link is
// /reset-password?token=...). PostHog records the full URL on every event
// ($current_url, $referrer, initial-URL person props), so they are redacted
// before anything leaves the browser.
const SENSITIVE_PARAMS = ["token", "code", "state"];

function redactUrl(value: string): string {
	if (!value.includes("?")) return value;
	try {
		const url = new URL(value);
		let changed = false;
		for (const key of SENSITIVE_PARAMS) {
			if (url.searchParams.has(key)) {
				url.searchParams.set(key, "[redacted]");
				changed = true;
			}
		}
		return changed ? url.toString() : value;
	} catch {
		return value;
	}
}

function redactProps(props: Record<string, unknown> | undefined) {
	if (!props) return;
	for (const [key, value] of Object.entries(props)) {
		if (typeof value === "string") props[key] = redactUrl(value);
	}
}

export const redactSensitiveUrls: BeforeSendFn = (event) => {
	if (!event) return event;
	redactProps(event.properties);
	redactProps(event.$set);
	redactProps(event.$set_once);
	return event;
};

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
		before_send: redactSensitiveUrls,
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
