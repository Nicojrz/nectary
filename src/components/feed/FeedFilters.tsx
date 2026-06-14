"use client";
import { cn } from "@/lib/utils";
import {
  CATEGORY_LIST,
  POST_TYPE_LIST,
  type LiteraryCategory,
  type PostType,
} from "@/types/nectary";
import { CATEGORY_STYLES, POST_TYPE_STYLES } from "@/lib/nectary-styles";
import { SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedFiltersProps {
  category: LiteraryCategory | "all";
  postType: PostType | "all";
  onCategory: (c: LiteraryCategory | "all") => void;
  onPostType: (t: PostType | "all") => void;
  className?: string;
}

export function FeedFilters({
  category,
  postType,
  onCategory,
  onPostType,
  className,
}: FeedFiltersProps) {
  return (
    <div className={cn("glass-panel rounded-3xl p-5", className)}>
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-foreground">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        Filters
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Post type
      </p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        <FilterChip active={postType === "all"} onClick={() => onPostType("all")}>
          All
        </FilterChip>
        {POST_TYPE_LIST.map((t) => (
          <FilterChip
            key={t.id}
            active={postType === t.id}
            activeClass={POST_TYPE_STYLES[t.id].badge}
            onClick={() => onPostType(t.id)}
          >
            {t.label}
          </FilterChip>
        ))}
      </div>

      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Category
      </p>
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={category === "all"} onClick={() => onCategory("all")}>
          All
        </FilterChip>
        {CATEGORY_LIST.map((c) => (
          <FilterChip
            key={c.id}
            active={category === c.id}
            activeClass={CATEGORY_STYLES[c.id].badge}
            onClick={() => onCategory(c.id)}
          >
            {c.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}

function FilterChip({
  children,
  active,
  activeClass,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  activeClass?: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="sm"
      onClick={onClick}
      className={cn(
        "h-7 rounded-full border px-3 text-xs font-medium transition-all",
        active
          ? activeClass
            ? cn("border-transparent", activeClass)
            : "border-transparent bg-primary text-primary-foreground"
          : "border-border/70 bg-card/35 text-muted-foreground hover:border-primary/20 hover:bg-card/70 hover:text-foreground",
      )}
    >
      {children}
    </Button>
  );
}


