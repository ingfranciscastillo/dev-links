import type { FetchResult, StackOverflowPayload } from "./types";

const BASE = "https://api.stackexchange.com/2.3";

async function soFetch<T>(path: string): Promise<T> {
	const res = await fetch(`${BASE}${path}`, {
		headers: { Accept: "application/json" },
	});
	if (!res.ok) throw new Error(`StackOverflow ${res.status}`);
	const json = (await res.json()) as {
		items?: T;
		error_message?: string;
		backoff?: number;
	};
	if (json.error_message) throw new Error(json.error_message);
	return (json.items ?? ([] as unknown as T)) as T;
}

function extractUserId(handle: string): number {
	const fromUrl = handle.match(/users\/(\d+)/);
	if (fromUrl) return Number(fromUrl[1]);

	const asNumber = Number(handle.trim());
	if (Number.isInteger(asNumber) && asNumber > 0) return asNumber;

	throw new Error(
		"Stack Overflow handle must be a numeric user id or profile URL",
	);
}

export async function fetchStackOverflow(input: {
	handle: string;
}): Promise<FetchResult[]> {
	const userId = extractUserId(input.handle);

	const [users, answers] = await Promise.all([
		soFetch<Array<Record<string, unknown>>>(
			`/users/${userId}?site=stackoverflow`,
		),
		soFetch<Array<Record<string, unknown>>>(
			`/users/${userId}/answers?order=desc&sort=votes&pagesize=5&site=stackoverflow`,
		),
	]);

	const user = users[0];
	if (!user) throw new Error("Stack Overflow user not found");

	const qids = answers.map((a) => a.question_id as number).filter(Boolean);
	const titles = new Map<number, string>();
	if (qids.length) {
		try {
			const questions = await soFetch<
				Array<{ question_id: number; title: string; link: string }>
			>(`/questions/${qids.join(";")}?site=stackoverflow`);
			for (const q of questions) titles.set(q.question_id, q.title);
		} catch {
			// Non-blocking
		}
	}

	const badges =
		(user.badge_counts as {
			gold?: number;
			silver?: number;
			bronze?: number;
		}) ?? {};
	const payload: StackOverflowPayload = {
		user: {
			display_name: (user.display_name as string) ?? "",
			reputation: (user.reputation as number) ?? 0,
			profile_image: (user.profile_image as string | null) ?? null,
			link: (user.link as string) ?? "",
			badges: {
				gold: badges.gold ?? 0,
				silver: badges.silver ?? 0,
				bronze: badges.bronze ?? 0,
			},
		},
		answers: answers.map((a) => ({
			question_id: a.question_id as number,
			answer_id: a.answer_id as number,
			score: a.score as number,
			is_accepted: (a.is_accepted as boolean) ?? false,
			title: titles.get(a.question_id as number) ?? "Answer",
			link: `https://stackoverflow.com/a/${a.answer_id}`,
		})),
	};

	return [
		{ kind: "profile", payload: payload as unknown as Record<string, unknown> },
	];
}
