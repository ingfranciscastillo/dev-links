import type { FetchResult, MediumPayload } from "./types";

function pick(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1]!.trim() : null;
}

function stripCData(s: string | null): string {
  if (!s) return "";
  return s.replace(/^<!\[CDATA\[|\]\]>$/g, "").trim();
}

function stripTags(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export async function fetchMedium(input: { handle: string }): Promise<FetchResult[]> {
  const handle = input.handle.trim().replace(/^@/, "");
  if (!handle) throw new Error("Empty Medium handle");
  const res = await fetch(`https://medium.com/feed/@${encodeURIComponent(handle)}`, {
    headers: { Accept: "application/rss+xml, text/xml", "User-Agent": "DevLinks-Integrations/1.0" },
  });
  if (!res.ok) throw new Error(`Medium ${res.status}`);
  const xml = await res.text();
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const posts: MediumPayload["posts"] = items.slice(0, 10).map((block) => {
    const title = stripCData(pick(block, "title"));
    const link = stripCData(pick(block, "link"));
    const pub = stripCData(pick(block, "pubDate"));
    const content = stripCData(pick(block, "content:encoded"));
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/i);
    return {
      title,
      url: link,
      summary: stripTags(content).slice(0, 220),
      cover_image: imgMatch ? imgMatch[1]! : null,
      published_at: pub ? new Date(pub).toISOString() : "",
    };
  });
  return [{ kind: "posts", payload: { posts } as unknown as Record<string, unknown> }];
}
