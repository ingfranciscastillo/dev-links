// In-memory, best-effort sliding-window limiter — per server instance, resets
// on redeploy/cold start. Same pattern already used in
// github-grader.functions.ts's allowRequest(). Good enough to stop a single
// visitor from flooding one profile's analytics tables; not a distributed
// limiter for real multi-instance traffic.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, windowMs: number, max: number): boolean {
	const now = Date.now();
	const windowStart = now - windowMs;
	const recent = (hits.get(key) ?? []).filter((t) => t > windowStart);
	if (recent.length >= max) return false;
	recent.push(now);
	hits.set(key, recent);
	return true;
}
