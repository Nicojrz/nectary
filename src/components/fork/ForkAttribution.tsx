import Link from "next/link";
import { GitCommitHorizontal } from "lucide-react";
import type { ForkOrigin } from "@/types/nectary";

export function ForkAttribution({ origin, className = "" }: { origin: ForkOrigin; className?: string }) {
  return (
    <div className={`rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm ${className}`}>
      <div className="flex items-start gap-2.5">
        <GitCommitHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Derivado con atribución</p>
          <p className="mt-1 text-muted-foreground">
            De <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={`/${origin.sourceType}/${origin.sourceId}`}>{origin.title}</Link>
            {" · versión "}{origin.sourceVersion}{" · "}{origin.authorName}
          </p>
          <p className="mt-1 line-clamp-2 italic text-foreground/75">“{origin.motivation}”</p>
        </div>
      </div>
    </div>
  );
}
