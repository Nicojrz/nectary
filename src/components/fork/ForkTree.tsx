import { cn } from "@/lib/utils";
import { GitFork, GitCommitHorizontal } from "lucide-react";

interface ForkNode {
  author: string;
  initials: string;
  tint: string;
  label: string;
  time: string;
  depth: number; // 0 = root trunk, 1 = first fork level, 2 = nested
}

const NODES: ForkNode[] = [
  { author: "Iván Reyes", initials: "IR", tint: "bg-poesia-soft text-poesia", label: "Original spark", time: "2h", depth: 0 },
  { author: "Mara Solano", initials: "MS", tint: "bg-cuento-soft text-cuento", label: "Forked → reframed as prose", time: "1h", depth: 1 },
  { author: "Téo Marchetti", initials: "TM", tint: "bg-ensayo-soft text-ensayo", label: "Forked → essay angle", time: "48m", depth: 1 },
  { author: "Lin Park", initials: "LP", tint: "bg-accent text-primary", label: "Forked Mara's branch", time: "22m", depth: 2 },
];

export function ForkTree({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-card", className)}>
      <div className="mb-1 flex items-center gap-2 text-sm font-bold text-foreground">
        <GitFork className="h-4 w-4 text-primary" />
        Fork tree
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        How <span className="font-semibold text-foreground">“The forgetful lighthouse”</span> branched
      </p>

      <ol className="relative">
        {NODES.map((node, i) => {
          const isLast = i === NODES.length - 1;
          const indent = node.depth * 24;
          return (
            <li key={i} className="relative flex gap-3 pb-5 last:pb-0" style={{ paddingLeft: indent }}>
              {/* vertical connector */}
              {!isLast && (
                <span
                  className="absolute top-7 w-px bg-border"
                  style={{ left: indent + 13, bottom: 0 }}
                  aria-hidden
                />
              )}
              {/* branch elbow for forks */}
              {node.depth > 0 && (
                <span
                  className="absolute top-3.5 h-px bg-border"
                  style={{ left: indent - 11, width: 11 }}
                  aria-hidden
                />
              )}

              {/* node dot / avatar */}
              <span
                className={cn(
                  "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-4 ring-card",
                  node.tint,
                )}
              >
                {node.initials}
              </span>

              <div className="min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold text-foreground">{node.author}</span>
                  {node.depth === 0 ? (
                    <GitCommitHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <GitFork className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {node.label} · {node.time}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      <button className="mt-1 w-full rounded-xl border border-border bg-secondary/50 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
        View full graph
      </button>
    </div>
  );
}

