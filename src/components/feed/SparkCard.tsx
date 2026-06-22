import { cn, truncateDynamic } from "@/lib/utils";
import type { SparkPost } from "@/types/nectary";
import { CATEGORY_STYLES } from "@/lib/nectary-styles";
import { CategoryBadge } from "./CategoryBadge";
import { PostTypeBadge } from "./PostTypeBadge";
import { AuthorChip } from "@/components/profile/AuthorChip";
import { ReactionBar } from "@/components/shared/ReactionBar";
import { Quote } from "lucide-react";
import { ForkAttribution } from "@/components/fork/ForkAttribution";

interface SparkCardProps {
  post: SparkPost;
  onFork?: () => void;
  className?: string;
}

export function SparkCard({ post, onFork, className }: SparkCardProps) {
  const cat = CATEGORY_STYLES[post.category];
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-[2rem] border border-card/80 bg-card/80 p-6 shadow-card backdrop-blur-xl transition-all duration-300 sm:p-7",
        "hover:-translate-y-0.5 hover:border-primary/15 hover:shadow-lift",
        className,
      )}
    >
      <div className="mb-5 flex items-center justify-between gap-2">
        <AuthorChip author={post.author} timestamp={post.createdAt} />
        <div className="flex items-center gap-3">
          <CategoryBadge category={post.category} />
          <PostTypeBadge type="spark" />
        </div>
      </div>

      <Quote className={cn("mb-1 h-5 w-5 opacity-20", cat.text)} aria-hidden />

      <p className="font-serif text-xl leading-[1.58] text-foreground sm:text-[1.45rem]">{truncateDynamic(post.body)}</p>

      {post.forkOrigin && <ForkAttribution origin={post.forkOrigin} className="mt-5" />}

      <ReactionBar
        className="mt-6 border-t border-border/60 pt-4"
        postId={post.id}
        postType={post.type}
        reactions={post.reactions}
        forks={post.forks}
        onFork={onFork}
      />
    </article>
  );
}

