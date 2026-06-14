import { cn } from "@/lib/utils";
import { AVATAR_TINTS } from "@/lib/nectary-styles";
import type { Author } from "@/types/nectary";

interface AuthorChipProps {
  author: Author;
  timestamp?: string;
  size?: "sm" | "md";
  className?: string;
}

export function AuthorChip({ author, timestamp, size = "md", className }: AuthorChipProps) {
  const avatarSize = size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs";
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-bold",
          avatarSize,
          AVATAR_TINTS[author.tint] ?? AVATAR_TINTS.primary,
        )}
      >
        {author.initials}
      </div>
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-semibold text-foreground">{author.name}</span>
        </div>
        <div className="truncate text-xs text-muted-foreground">
          @{author.handle}
          {timestamp && <span className="text-muted-foreground/70"> · {timestamp}</span>}
        </div>
      </div>
    </div>
  );
}

