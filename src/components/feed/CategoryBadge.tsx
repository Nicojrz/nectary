import { cn } from "@/lib/utils";
import { CATEGORIES, type LiteraryCategory } from "@/types/nectary";
import { CATEGORY_STYLES } from "@/lib/nectary-styles";

interface CategoryBadgeProps {
  category: LiteraryCategory;
  className?: string;
  withDot?: boolean;
}

export function CategoryBadge({ category, className, withDot = true }: CategoryBadgeProps) {
  const meta = CATEGORIES[category];
  const styles = CATEGORY_STYLES[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
        styles.badge,
        className,
      )}
    >
      {withDot && <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />}
      {meta.label}
    </span>
  );
}

