// Literal Tailwind class maps so the v4 compiler keeps dynamic accent classes.
// (Class strings must appear verbatim in source to be generated.)

import type { LiteraryCategory, PostType, WipStatus, CreativeState } from "@/types/nectary";

export const CATEGORY_STYLES: Record<
  LiteraryCategory,
  { badge: string; dot: string; text: string; ring: string; bar: string }
> = {
  cuento: {
    badge: "bg-cuento-soft text-cuento",
    dot: "bg-cuento",
    text: "text-cuento",
    ring: "ring-cuento/30",
    bar: "bg-cuento",
  },
  poesia: {
    badge: "bg-poesia-soft text-poesia",
    dot: "bg-poesia",
    text: "text-poesia",
    ring: "ring-poesia/30",
    bar: "bg-poesia",
  },
  novela: {
    badge: "bg-novela-soft text-novela",
    dot: "bg-novela",
    text: "text-novela",
    ring: "ring-novela/30",
    bar: "bg-novela",
  },
  ensayo: {
    badge: "bg-ensayo-soft text-ensayo",
    dot: "bg-ensayo",
    text: "text-ensayo",
    ring: "ring-ensayo/30",
    bar: "bg-ensayo",
  },
};

export const POST_TYPE_STYLES: Record<
  PostType,
  { badge: string; dot: string; text: string; accentBar: string }
> = {
  spark: {
    badge: "bg-spark-soft text-spark",
    dot: "bg-spark",
    text: "text-spark",
    accentBar: "bg-spark",
  },
  wip: {
    badge: "bg-wip-soft text-wip",
    dot: "bg-wip",
    text: "text-wip",
    accentBar: "bg-wip",
  },
  postmortem: {
    badge: "bg-postmortem-soft text-postmortem",
    dot: "bg-postmortem",
    text: "text-postmortem",
    accentBar: "bg-postmortem",
  },
};

export const WIP_STATUS_STYLES: Record<
  WipStatus,
  { label: string; chip: string; dot: string }
> = {
  "in-progress": {
    label: "In progress",
    chip: "bg-wip-soft text-wip",
    dot: "bg-wip",
  },
  blocked: {
    label: "Blocked",
    chip: "bg-destructive/10 text-destructive",
    dot: "bg-destructive",
  },
  completed: {
    label: "Completed",
    chip: "bg-ensayo-soft text-ensayo",
    dot: "bg-ensayo",
  },
};

export const CREATIVE_STATE_STYLES: Record<
  CreativeState,
  { dot: string; text: string; activeBg: string }
> = {
  flow: { dot: "bg-flow", text: "text-flow", activeBg: "bg-flow/15 text-flow" },
  mild: { dot: "bg-mild", text: "text-mild", activeBg: "bg-mild/15 text-mild" },
  severe: { dot: "bg-severe", text: "text-severe", activeBg: "bg-severe/15 text-severe" },
};

export const AVATAR_TINTS: Record<string, string> = {
  cuento: "bg-cuento-soft text-cuento",
  poesia: "bg-poesia-soft text-poesia",
  novela: "bg-novela-soft text-novela",
  ensayo: "bg-ensayo-soft text-ensayo",
  spark: "bg-spark-soft text-spark",
  primary: "bg-accent text-primary",
};
