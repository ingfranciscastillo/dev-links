import type { FetchResult, GithubPayload } from "./types";

const UA = "DevLinks-Integrations/1.0";

async function ghFetch(url: string, token?: string) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": UA,
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${await res.text().catch(() => res.statusText)}`);
  return res.json();
}

function parseHeatmap(html: string): Array<{ date: string; level: number; count?: number }> {
  const out: Array<{ date: string; level: number; count?: number }> = [];
  // GitHub contribution graph uses <td data-date="..." data-level="0-4">
  const re = /data-date="(\d{4}-\d{2}-\d{2})"[^>]*data-level="(\d)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    out.push({ date: m[1]!, level: Number(m[2]) });
  }
  return out;
}

export async function fetchGithub(input: {
  handle: string;
  config: { pinned?: string[] };
}): Promise<FetchResult[]> {
  const token = process.env.GITHUB_TOKEN;
  const handle = input.handle.trim().replace(/^@/, "");
  if (!handle) throw new Error("Empty GitHub handle");

  const [profile, repos] = await Promise.all([
    ghFetch(`https://api.github.com/users/${encodeURIComponent(handle)}`, token),
    ghFetch(
      `https://api.github.com/users/${encodeURIComponent(handle)}/repos?sort=updated&per_page=6&type=owner`,
      token,
    ),
  ]);

  const pinnedSlugs = (input.config.pinned ?? []).slice(0, 6);
  const pinned = await Promise.all(
    pinnedSlugs.map(async (slug) => {
      try {
        return await ghFetch(`https://api.github.com/repos/${slug}`, token);
      } catch {
        return null;
      }
    }),
  );

  // Heatmap (best-effort scrape)
  let heatmap: Array<{ date: string; level: number }> = [];
  try {
    const res = await fetch(`https://github.com/users/${encodeURIComponent(handle)}/contributions`, {
      headers: { "User-Agent": UA, Accept: "text/html" },
    });
    if (res.ok) heatmap = parseHeatmap(await res.text()).slice(-365);
  } catch {
    // ignore
  }

  const langCounts = new Map<string, number>();
  for (const r of repos as Array<{ language: string | null }>) {
    if (r.language) langCounts.set(r.language, (langCounts.get(r.language) ?? 0) + 1);
  }

  const payload: GithubPayload = {
    profile: {
      login: profile.login,
      name: profile.name,
      bio: profile.bio,
      avatar_url: profile.avatar_url,
      followers: profile.followers,
      following: profile.following,
      public_repos: profile.public_repos,
      html_url: profile.html_url,
    },
    repos: (repos as Array<Record<string, unknown>>).map((r) => ({
      name: r.name as string,
      full_name: r.full_name as string,
      description: (r.description as string | null) ?? null,
      stars: (r.stargazers_count as number) ?? 0,
      forks: (r.forks_count as number) ?? 0,
      language: (r.language as string | null) ?? null,
      url: r.html_url as string,
      updated_at: r.updated_at as string,
    })),
    pinned: pinned
      .filter((r): r is Record<string, unknown> => !!r)
      .map((r) => ({
        name: r.name as string,
        full_name: r.full_name as string,
        description: (r.description as string | null) ?? null,
        stars: (r.stargazers_count as number) ?? 0,
        forks: (r.forks_count as number) ?? 0,
        language: (r.language as string | null) ?? null,
        url: r.html_url as string,
      })),
    heatmap,
    totals: {
      stars: (repos as Array<{ stargazers_count?: number }>).reduce((s, r) => s + (r.stargazers_count ?? 0), 0),
      forks: (repos as Array<{ forks_count?: number }>).reduce((s, r) => s + (r.forks_count ?? 0), 0),
    },
    topLanguages: [...langCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([language, count]) => ({ language, count })),
  };

  return [{ kind: "profile", payload: payload as unknown as Record<string, unknown> }];
}
