// Pure lookup helpers for classifying traffic sources — no server-only
// dependencies (no crypto, no request headers), so this can be imported by
// analytics.functions.ts, which is bundled for the client (server function
// RPC stubs), without tripping the server-only import boundary.

// In-app browsers (Instagram, WhatsApp, etc.) strip document.referrer, so the
// only place they identify themselves is the UA string. Order matters:
// Facebook's own webview also ships FBAN/FBAV, so check the more specific
// app names first.
export function detectInAppSource(ua: string): string | null {
	if (/Instagram/i.test(ua)) return "instagram";
	if (/\bFBAN\/|FBAV\/|FB_IAB/i.test(ua)) return "facebook";
	if (/WhatsApp/i.test(ua)) return "whatsapp";
	if (/\bLine\//i.test(ua)) return "line";
	if (/LinkedInApp/i.test(ua)) return "linkedin";
	if (/Snapchat/i.test(ua)) return "snapchat";
	if (/TikTok|BytedanceWebview|musical_ly/i.test(ua)) return "tiktok";
	if (/\bPinterest\//i.test(ua)) return "pinterest";
	return null;
}

// Referrer hostnames known apps use for their web-click redirect, seen when
// the link was opened from the app's mobile-web surface (not the in-app
// browser) or from desktop web — document.referrer does survive here.
const KNOWN_REFERRER_SOURCES: Array<[RegExp, string]> = [
	[/(^|\.)t\.co$/i, "x"],
	[/(^|\.)l\.instagram\.com$/i, "instagram"],
	[/(^|\.)lm\.facebook\.com$/i, "facebook"],
	[/(^|\.)l\.facebook\.com$/i, "facebook"],
	[/(^|\.)out\.reddit\.com$/i, "reddit"],
	[/(^|\.)l\.messenger\.com$/i, "messenger"],
];

export function knownSourceFromHostname(hostname: string): string | null {
	const match = KNOWN_REFERRER_SOURCES.find(([re]) => re.test(hostname));
	return match ? match[1] : null;
}
