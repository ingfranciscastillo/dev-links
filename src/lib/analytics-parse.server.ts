// Server-only helpers for lightweight User-Agent parsing + weekly IP salting.
import { createHash } from "crypto";

export type ParsedUA = {
	device: "mobile" | "tablet" | "desktop" | "bot";
	browser: string;
	os: string;
};

export function parseUA(ua: string): ParsedUA {
	const u = (ua || "").slice(0, 512);
	const lower = u.toLowerCase();

	const isBot = /(bot|crawler|spider|curl|wget|headless|preview|monitor)/i.test(
		u,
	);
	let device: ParsedUA["device"] = "desktop";
	if (isBot) device = "bot";
	else if (/ipad|tablet/i.test(u)) device = "tablet";
	else if (/mobi|iphone|android(?!.*tablet)/i.test(u)) device = "mobile";

	let browser = "Other";
	if (/edg\//i.test(u)) browser = "Edge";
	else if (/opr\/|opera/i.test(u)) browser = "Opera";
	else if (/chrome\//i.test(lower) && !/chromium/i.test(lower))
		browser = "Chrome";
	else if (/firefox\//i.test(lower)) browser = "Firefox";
	else if (/safari\//i.test(lower) && !/chrome/i.test(lower))
		browser = "Safari";

	let os = "Other";
	if (/windows nt/i.test(u)) os = "Windows";
	else if (/mac os x|macintosh/i.test(u)) os = "macOS";
	else if (/android/i.test(u)) os = "Android";
	else if (/iphone|ipad|ios/i.test(u)) os = "iOS";
	else if (/linux/i.test(u)) os = "Linux";

	return { device, browser, os };
}

// ISO week key (e.g. "2026-W38"). A rotating salt keeps the raw IP
// unrecoverable while still letting the same visitor be recognized across
// the days inside one week — a daily salt (the previous scheme) made every
// "unique visitors" count double-count anyone who came back the next day,
// since the same IP hashed differently each day.
function isoWeekKey(date: Date): string {
	const d = new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	);
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	const weekNo = Math.ceil(
		((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
	);
	return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export function hashIP(ip: string): string {
	const salt = process.env.ANALYTICS_SALT || "devlinks-analytics-salt-v1";
	const week = isoWeekKey(new Date());
	return createHash("sha256")
		.update(`${salt}:${week}:${ip}`)
		.digest("hex")
		.slice(0, 32);
}

export function extractIP(request: Request): string {
	return (
		request.headers.get("cf-connecting-ip") ||
		request.headers.get("x-real-ip") ||
		(request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
		"0.0.0.0"
	);
}

export function extractCountry(request: Request): string | null {
	return (
		request.headers.get("cf-ipcountry") ||
		request.headers.get("x-vercel-ip-country") ||
		null
	);
}
