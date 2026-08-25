// TODO: backend endpoints /api/public/hooks/track-view and /track-click pending migration.
export function trackView(username: string, path: string) {
	if (typeof window === "undefined") return;
	try {
		const body = JSON.stringify({
			username,
			path,
			referrer: document.referrer || null,
		});
		fetch("/api/public/hooks/track-view", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
			keepalive: true,
		}).catch(() => {});
	} catch {
		// Ignore
	}
}

export function trackClick(input: {
	username: string;
	linkId?: string | null;
	url: string;
	title?: string;
}) {
	if (typeof window === "undefined") return;
	try {
		const body = JSON.stringify({
			username: input.username,
			linkId: input.linkId ?? null,
			url: input.url,
			title: input.title ?? "",
			referrer: document.referrer || null,
		});
		const url = "/api/public/hooks/track-click";
		if (navigator.sendBeacon) {
			const blob = new Blob([body], { type: "application/json" });
			navigator.sendBeacon(url, blob);
		} else {
			fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body,
				keepalive: true,
			}).catch(() => {});
		}
	} catch {
		// Ignore
	}
}
