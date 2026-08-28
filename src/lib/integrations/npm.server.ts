import type { FetchResult, NpmPayload } from "./types";

export async function fetchNpm(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = input.handle.trim().replace(/^@/, "");
	if (!handle) throw new Error("Empty npm username");
	const res = await fetch(
		`https://registry.npmjs.org/-/v1/search?text=maintainer:${encodeURIComponent(handle)}&size=20`,
		{
			headers: {
				Accept: "application/json",
				"User-Agent": "DevLinks-Integrations/1.0",
			},
		},
	);
	if (!res.ok) throw new Error(`npm ${res.status}`);
	const json = (await res.json()) as {
		objects?: Array<{
			package: {
				name: string;
				description?: string;
				version: string;
				links?: { npm?: string };
			};
		}>;
	};
	const pkgs = (json.objects ?? []).map((o) => o.package);

	const downloads = await Promise.all(
		pkgs.map(async (p) => {
			try {
				const r = await fetch(
					`https://api.npmjs.org/downloads/point/last-week/${p.name}`,
					{
						headers: { Accept: "application/json" },
					},
				);
				if (!r.ok) return null;
				const d = (await r.json()) as { downloads?: number };
				return d.downloads ?? null;
			} catch {
				return null;
			}
		}),
	);

	const packages = pkgs.map((p, i) => ({
		name: p.name,
		description: p.description ?? "",
		version: p.version,
		url: p.links?.npm ?? `https://www.npmjs.com/package/${p.name}`,
		weekly_downloads: downloads[i] ?? null,
	}));
	packages.sort(
		(a, b) => (b.weekly_downloads ?? 0) - (a.weekly_downloads ?? 0),
	);

	const payload: NpmPayload = {
		username: handle,
		url: `https://www.npmjs.com/~${handle}`,
		packages,
		total_weekly_downloads: packages.reduce(
			(sum, p) => sum + (p.weekly_downloads ?? 0),
			0,
		),
	};
	return [
		{
			kind: "packages",
			payload: payload as unknown as Record<string, unknown>,
		},
	];
}
