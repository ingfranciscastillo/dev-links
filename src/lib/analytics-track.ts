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
		// Los links abren en pestaña nueva (target="_blank"), la página actual
		// nunca se descarga, así que no hace falta sendBeacon — y sendBeacon
		// es justo el patrón que ad-blockers y protección anti-tracking del
		// navegador bloquean con más frecuencia (es la API clásica de
		// analytics), lo que hacía fallar el conteo en silencio.
		fetch("/api/public/hooks/track-click", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body,
			keepalive: true,
		}).catch(() => {});
	} catch {
		// Ignore
	}
}
