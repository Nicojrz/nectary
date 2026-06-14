"use client";
import { cn } from "@/lib/utils";
import type { WipPost } from "@/types/nectary";
import { WIP_STATUS_STYLES, POST_TYPE_STYLES } from "@/lib/nectary-styles";
import { CategoryBadge } from "./CategoryBadge";
import { PostTypeBadge } from "./PostTypeBadge";
import { AuthorChip } from "@/components/profile/AuthorChip";
import { ReactionBar } from "@/components/shared/ReactionBar";
import { ArrowRight, AlertTriangle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WipCardProps {
  post: WipPost;
  onFork?: () => void;
  className?: string;
}

export function WipCard({ post, onFork, className }: WipCardProps) {
  const status = WIP_STATUS_STYLES[post.status];
  const typeStyles = POST_TYPE_STYLES.wip;
  const isBlocked = post.status === "blocked";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-card/80 bg-card/80 shadow-card backdrop-blur-xl transition-all duration-300",
        "hover:shadow-lift hover:border-primary/15",
        className,
      )}
    >
      <span className={cn("absolute inset-y-0 left-0 w-1", typeStyles.accentBar)} aria-hidden />

      <div className="p-6 pl-7 sm:p-8 sm:pl-9">
        <div className="mb-6 flex items-start justify-between gap-3">
          <AuthorChip author={post.author} timestamp={post.createdAt} />
          <div className="flex flex-wrap justify-end gap-2">
          <PostTypeBadge type="wip" />
          <CategoryBadge category={post.category} />
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide",
              status.chip,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
          </div>
        </div>

        <h3 className="font-serif text-3xl leading-tight text-foreground">{post.title}</h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">{post.summary}</p>

        {/* progress */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              {post.wordCount.toLocaleString()} words
            </span>
            <span className="tabular-nums font-semibold text-foreground">{post.progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full rounded-full transition-all", isBlocked ? "bg-destructive" : typeStyles.accentBar)}
              style={{ width: `${post.progress}%` }}
            />
          </div>
        </div>

        {/* current block callout */}
        {post.currentBlock && (
          <div className="mt-4 flex gap-2.5 rounded-xl border border-destructive/20 bg-destructive/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-destructive">Current block</p>
              <p className="mt-0.5 text-sm leading-relaxed text-foreground/80">{post.currentBlock}</p>
            </div>
          </div>
        )}

        <div className="mt-6 flex items-center justify-end border-t border-border/60 pt-5">
          <Button
            type="button"
            onClick={onFork}
            variant="outline"
            size="sm"
            className="rounded-full bg-card/50"
          >
            Leer el WIP completo
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <ReactionBar className="mt-3" reactions={post.reactions} forks={post.forks} onFork={onFork} />
      </div>
    </article>
  );
}



