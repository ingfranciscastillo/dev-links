import { ArrowUpRight } from "lucide-react";
import type { MediumPayload } from "@/lib/integrations/types";

export function MediumBlock({ payload }: { payload: MediumPayload }) {
  if (payload.posts.length === 0) return null;
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
        Medium
      </h2>
      <div className="grid gap-2">
        {payload.posts.map((p) => (
          <a key={p.url} href={p.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 rounded-xl border border-hairline bg-surface p-4 transition-colors hover:bg-surface-elevated">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{p.title}</p>
              {p.summary && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.summary}</p>}
            </div>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </a>
        ))}
      </div>
    </section>
  );
}
