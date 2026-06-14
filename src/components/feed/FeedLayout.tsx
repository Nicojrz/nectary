import { cn } from "@/lib/utils";
import type { FeedPost } from "@/types/nectary";
import { SparkCard } from "./SparkCard";
import { WipCard } from "./WipCard";
import { PostMortemCard } from "./PostMortemCard";

interface FeedLayoutProps {
  posts: FeedPost[];
  onFork: (post: FeedPost) => void;
  className?: string;
}

export function FeedLayout({ posts, onFork, className }: FeedLayoutProps) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <p className="font-serif text-lg text-foreground">No posts match these filters.</p>
        <p className="mt-1 text-sm text-muted-foreground">Try clearing a filter to see more.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {posts.map((post) =>
        post.type === "spark" ? (
          <SparkCard key={post.id} post={post} onFork={() => onFork(post)} />
        ) : post.type === "wip" ? (
          <WipCard key={post.id} post={post} onFork={() => onFork(post)} />
        ) : (
          <PostMortemCard key={post.id} post={post} onFork={() => onFork(post)} />
        ),
      )}
    </div>
  );
}

