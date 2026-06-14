// Shared domain types + static config for Nectary.

export type LiteraryCategory = "cuento" | "poesia" | "novela" | "ensayo";
export type PostType = "spark" | "wip" | "postmortem";
export type CreativeState = "flow" | "mild" | "severe";
export type WipStatus = "in-progress" | "blocked" | "completed";

export interface CategoryMeta {
  id: LiteraryCategory;
  label: string;
  /** tailwind color token name */
  token: string;
  softToken: string;
}

export const CATEGORIES: Record<LiteraryCategory, CategoryMeta> = {
  cuento: { id: "cuento", label: "Cuento", token: "cuento", softToken: "cuento-soft" },
  poesia: { id: "poesia", label: "Poesía", token: "poesia", softToken: "poesia-soft" },
  novela: { id: "novela", label: "Novela", token: "novela", softToken: "novela-soft" },
  ensayo: { id: "ensayo", label: "Ensayo", token: "ensayo", softToken: "ensayo-soft" },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export interface PostTypeMeta {
  id: PostType;
  label: string;
  token: string;
  softToken: string;
}

export const POST_TYPES: Record<PostType, PostTypeMeta> = {
  spark: { id: "spark", label: "Spark", token: "spark", softToken: "spark-soft" },
  wip: { id: "wip", label: "WIP", token: "wip", softToken: "wip-soft" },
  postmortem: { id: "postmortem", label: "Post-Mortem", token: "postmortem", softToken: "postmortem-soft" },
};

export const POST_TYPE_LIST = Object.values(POST_TYPES);

export const CREATIVE_STATES: Record<
  CreativeState,
  { id: CreativeState; label: string; token: string }
> = {
  flow: { id: "flow", label: "Flow", token: "flow" },
  mild: { id: "mild", label: "Mild Block", token: "mild" },
  severe: { id: "severe", label: "Severe Block", token: "severe" },
};

// Reacciones simplificadas (tipo X/IG)

export interface Author {
  name: string;
  handle: string;
  initials: string;
  tint: string; // color token for avatar
  level: number;
}

export interface BaseReactions {
  likes: number;
}

export interface SparkPost {
  id: string;
  type: "spark";
  category: LiteraryCategory;
  author: Author;
  body: string;
  createdAt: string;
  reactions: BaseReactions;
  forks: number;
}

export interface WipPost {
  id: string;
  type: "wip";
  category: LiteraryCategory;
  author: Author;
  title: string;
  summary: string;
  status: WipStatus;
  progress: number; // 0-100
  currentBlock?: string;
  wordCount: number;
  createdAt: string;
  reactions: BaseReactions;
  forks: number;
}

export interface PostMortemPost {
  id: string;
  type: "postmortem";
  category: LiteraryCategory;
  author: Author;
  title: string;
  body: string;
  lesson: string;
  createdAt: string;
  reactions: BaseReactions;
  forks: number;
}

export type FeedPost = SparkPost | WipPost | PostMortemPost;
