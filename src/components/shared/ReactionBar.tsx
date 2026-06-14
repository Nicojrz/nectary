"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BaseReactions } from "@/types/nectary";
import { GitFork, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReactionBarProps {
  reactions: BaseReactions;
  forks: number;
  onFork?: () => void;
  comments?: number;
  className?: string;
}

export function ReactionBar({ reactions, forks, onFork, comments, className }: ReactionBarProps) {
  const [isLiked, setIsLiked] = useState(false);

  const toggleLike = () => setIsLiked((prev) => !prev);
  const likesCount = (reactions.likes ?? 0) + (isLiked ? 1 : 0);

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        aria-label="Like"
        aria-pressed={isLiked}
        onClick={toggleLike}
        className={cn(
          "group h-8 rounded-full border-0 px-2 text-xs font-medium transition-all",
          isLiked
            ? "bg-destructive/10 text-destructive"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        <Heart 
          className={cn("h-3.5 w-3.5 transition-transform group-hover:scale-125 group-active:scale-90", isLiked && "fill-current")} 
        />
        <span className="tabular-nums">{likesCount}</span>
      </Button>

      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden />

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onFork}
        className={cn(
          "h-8 rounded-full px-2 text-xs font-medium text-muted-foreground",
          "hover:bg-accent/60 hover:text-primary",
        )}
      >
        <GitFork className="h-3.5 w-3.5" />
        <span className="tabular-nums">{forks}</span>
      </Button>

      {comments !== undefined && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 rounded-full px-2 text-xs font-medium text-muted-foreground hover:bg-accent/60 hover:text-foreground"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span className="tabular-nums">{comments}</span>
        </Button>
      )}
    </div>
  );
}
