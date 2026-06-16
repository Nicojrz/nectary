import { cn } from "@/lib/utils";
import { POST_TYPES, type PostType } from "@/types/nectary";
import { POST_TYPE_STYLES } from "@/lib/nectary-styles";
import { Feather, BookOpen, HeartCrack } from "lucide-react";

const ICONS = {
  spark: Feather,
  wip: BookOpen,
  postmortem: HeartCrack,
} as const;

interface PostTypeBadgeProps {
  type: PostType;
  className?: string;
}

export function PostTypeBadge({ type, className }: PostTypeBadgeProps) {
  const meta = POST_TYPES[type];
  const styles = POST_TYPE_STYLES[type];
  const Icon = ICONS[type];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
        styles.badge,
        className,
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {meta.label}
    </span>
  );
}

