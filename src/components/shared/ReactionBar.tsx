"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { BaseReactions } from "@/types/nectary";
import { GitFork, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReactionBarProps {
  postId: string;
  postType: "spark" | "wip" | "postmortem";
  reactions: BaseReactions;
  forks: number;
  onFork?: () => void;
  comments?: number;
  className?: string;
}

export function ReactionBar({ postId, postType, reactions, forks, onFork, comments, className }: ReactionBarProps) {
  const [isLiked, setIsLiked] = useState(reactions.userHasLiked || false);
  const [localLikes, setLocalLikes] = useState(reactions.likes || 0);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async () => {
    if (isLoading) return;
    
    // Optimistic UI update
    setIsLiked((prev) => !prev);
    setLocalLikes((prev) => isLiked ? prev - 1 : prev + 1);
    setIsLoading(true);

    try {
      const res = await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_id: postId, target_type: postType }),
      });

      if (!res.ok) {
        throw new Error("Failed to toggle reaction");
      }
    } catch (error) {
      console.error(error);
      // Revert optimistic update
      setIsLiked((prev) => !prev);
      setLocalLikes((prev) => !isLiked ? prev - 1 : prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const likesCount = localLikes;

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
