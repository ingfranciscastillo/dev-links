import type { DevtoPayload, FetchResult } from "./types";

export async function fetchDevto(input: { handle: string }): Promise<FetchResult[]> {
  const handle = input.handle.trim().replace(/^@/, "");
  if (!handle) throw new Error("Empty Dev.to username");
  const res = await fetch(
    `https://dev.to/api/articles?username=${encodeURIComponent(handle)}&per_page=10`,
    { headers: { Accept: "application/json", "User-Agent": "DevLinks-Integrations/1.0" } },
  );
  if (!res.ok) throw new Error(`Dev.to ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  const payload: DevtoPayload = {
    articles: rows.map((r) => ({
      id: r.id as number,
      title: r.title as string,
      url: r.url as string,
      description: (r.description as string) ?? "",
      cover_image: (r.cover_image as string | null) ?? null,
      reactions: (r.public_reactions_count as number) ?? (r.positive_reactions_count as number) ?? 0,
      page_views: (r.page_views_count as number | null) ?? null,
      reading_time_minutes: (r.reading_time_minutes as number) ?? 1,
      published_at: r.published_at as string,
      tags: (r.tag_list as string[] | undefined) ?? [],
    })),
  };
  return [{ kind: "articles", payload: payload as unknown as Record<string, unknown> }];
}
