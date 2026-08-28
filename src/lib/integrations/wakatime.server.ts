import type { FetchResult, WakatimePayload } from "./types";

// Acepta un username limpio ("ryanhiizy"), con @ ("@ryanhiizy") o una URL
// de perfil pegada por accidente ("https://wakatime.com/@ryanhiizy").
function normalizeWakatimeHandle(raw: string): string {
	const trimmed = raw.trim();
	const urlMatch = trimmed.match(/wakatime\.com\/@?([\w.-]+)/i);
	if (urlMatch) return urlMatch[1]!;
	return trimmed.replace(/^@/, "");
}

// Cada usuario elige en su privacidad de WakaTime qué rango de tiempo hace
// público (Last 7 Days, Last 30 Days, Last 6 Months, Last Year, All Time).
// La API rechaza con 400 "Time range not matching user's public stats
// range." cualquier request que pida un rango distinto al que el usuario
// configuró. No hay forma de saber cuál eligió sin este mismo endpoint, así
// que se prueba en orden hasta que uno responda 200.
const RANGE_CANDIDATES = [
	"last_7_days",
	"last_30_days",
	"last_6_months",
	"last_year",
	"all_time",
] as const;

async function requestStats(handle: string, range: string): Promise<Response> {
	return fetch(
		`https://wakatime.com/api/v1/users/${encodeURIComponent(handle)}/stats/${range}`,
		{
			headers: {
				Accept: "application/json",
				"User-Agent": "DevLinks-Integrations/1.0",
			},
		},
	);
}

function isRangeMismatch(status: number, body: string): boolean {
	return status === 400 && /time range/i.test(body);
}

export async function fetchWakatime(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const handle = normalizeWakatimeHandle(input.handle);
	if (!handle) throw new Error("Empty WakaTime username");

	let ok: Response | null = null;
	let lastBody = "";

	for (const range of RANGE_CANDIDATES) {
		const res = await requestStats(handle, range);

		if (res.status === 401 || res.status === 403) {
			throw new Error(
				"WakaTime stats are private. Enable public profile + coding activity.",
			);
		}

		if (res.ok) {
			ok = res;
			break;
		}

		const body = await res.text().catch(() => "");
		lastBody = body;

		// Solo vale la pena seguir probando otro rango si el error es
		// específicamente por mismatch de rango público. Cualquier otro
		// error (rate limit, formato, 5xx) corta de inmediato para no
		// hacer hasta 5 requests innecesarios contra la API.
		if (!isRangeMismatch(res.status, body)) {
			throw new Error(
				`WakaTime ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}`,
			);
		}
	}

	if (!ok) {
		throw new Error(
			`WakaTime: no public stats range matched (tried ${RANGE_CANDIDATES.join(", ")})${
				lastBody ? `: ${lastBody.slice(0, 200)}` : ""
			}`,
		);
	}

	const json = (await ok.json()) as { data?: Record<string, unknown> };
	const d = json.data ?? {};
	const langs =
		(d.languages as Array<Record<string, unknown>> | undefined) ?? [];
	const editors =
		(d.editors as Array<Record<string, unknown>> | undefined) ?? [];
	const payload: WakatimePayload = {
		range: (d.range as string) ?? "last_7_days",
		total_human: (d.human_readable_total as string) ?? "0 hrs",
		daily_average_human: (d.human_readable_daily_average as string) ?? "0 hrs",
		languages: langs.slice(0, 8).map((l) => ({
			name: (l.name as string) ?? "",
			percent: Math.round(((l.percent as number) ?? 0) * 10) / 10,
			text: (l.text as string) ?? "",
		})),
		editors: editors.slice(0, 5).map((e) => ({
			name: (e.name as string) ?? "",
			percent: Math.round(((e.percent as number) ?? 0) * 10) / 10,
		})),
		url: `https://wakatime.com/@${handle}`,
	};
	return [
		{ kind: "stats", payload: payload as unknown as Record<string, unknown> },
	];
}
