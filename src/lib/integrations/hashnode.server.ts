import type { FetchResult, HashnodePayload } from "./types";

const QUERY = `query($host: String!) {
  publication(host: $host) {
    posts(first: 10) {
      edges { node {
        title brief url publishedAt reactionCount readTimeInMinutes
        coverImage { url }
        tags { name }
      } }
    }
  }
}`;

export async function fetchHashnode(input: { handle: string; config: { host?: string } }): Promise<FetchResult[]> {
  const host = (input.config.host || input.handle).trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (!host.includes(".")) throw new Error("Invalid Hashnode host (expected user.hashnode.dev)");
  const res = await fetch("https://gql.hashnode.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: QUERY, variables: { host } }),
  });
  if (!res.ok) throw new Error(`Hashnode ${res.status}`);
  const json = (await res.json()) as {
    data?: {
      publication?: {
        posts?: {
          edges?: Array<{
            node: {
              title: string;
              brief: string;
              url: string;
              publishedAt: string;
              reactionCount: number;
              readTimeInMinutes: number;
              coverImage?: { url: string } | null;
              tags?: Array<{ name: string }>;
            };
          }>;
        };
      } | null;
    };
    errors?: Array<{ message: string }>;
  };
  if (json.errors?.length) throw new Error(json.errors[0]!.message);
  if (!json.data?.publication) throw new Error("Publication not found");
  const payload: HashnodePayload = {
    posts: (json.data.publication.posts?.edges ?? []).map((e) => ({
      title: e.node.title,
      brief: e.node.brief,
      url: e.node.url,
      cover_image: e.node.coverImage?.url ?? null,
      reactions: e.node.reactionCount,
      reading_time_minutes: e.node.readTimeInMinutes,
      published_at: e.node.publishedAt,
      tags: (e.node.tags ?? []).map((t) => t.name),
    })),
  };
  return [{ kind: "posts", payload: payload as unknown as Record<string, unknown> }];
}
