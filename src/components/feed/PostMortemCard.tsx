"use client";
import { cn } from "@/lib/utils";
import type { PostMortemPost } from "@/types/nectary";
import { POST_TYPE_STYLES } from "@/lib/nectary-styles";
import { CategoryBadge } from "./CategoryBadge";
import { PostTypeBadge } from "./PostTypeBadge";
import { AuthorChip } from "@/components/profile/AuthorChip";
import { ReactionBar } from "@/components/shared/ReactionBar";
import { ArrowRight, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PostMortemCardProps {
  post: PostMortemPost;
  onFork?: () => void;
  className?: string;
}

export function PostMortemCard({ post, onFork, className }: PostMortemCardProps) {
  const typeStyles = POST_TYPE_STYLES.postmortem;
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
          <PostTypeBadge type="postmortem" />
          <CategoryBadge category={post.category} />
          </div>
        </div>

        <h3 className="font-serif text-3xl leading-tight text-foreground">{post.title}</h3>
        <p className="mt-3 font-serif text-lg leading-relaxed text-foreground/80">{post.body}</p>

        <div className="mt-4 flex gap-2.5 rounded-xl border border-postmortem/20 bg-postmortem-soft/60 p-3">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-postmortem" />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-postmortem">Lesson learned</p>
            <p className="mt-0.5 text-sm font-medium leading-relaxed text-foreground">{post.lesson}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-border/60 pt-5">
          <Button variant="outline" size="sm" onClick={onFork} className="rounded-full bg-card/50">
            Leer la reflexión completa
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ReactionBar className="mt-3" reactions={post.reactions} forks={post.forks} onFork={onFork} />
      </div>
    </article>
  );
}



