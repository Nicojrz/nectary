/**
 * Nectary — Shared TypeScript Type Definitions
 *
 * This file contains all shared types used across the application.
 * Types are organized by module to match the requirements document.
 */

// ============================================================
// Enums
// ============================================================

/** Types of publications on the platform */
export type PostType = "spark" | "wip" | "post-mortem";

/** Creative disciplines */
export type Discipline =
  | "design"
  | "music"
  | "writing"
  | "development"
  | "other";

/** WIP status states (RF-WP-03) */
export type WIPStatus = "blocked" | "in-progress" | "resolved";

/** Creative state of a user (RF-FD-03) */
export type CreativeState = "flow" | "mild-block" | "severe-block";

/** Notification types */
export type NotificationType =
  | "comment"
  | "fork"
  | "reaction"
  | "xp"
  | "badge"
  | "system";

// ============================================================
// User Module (GU)
// ============================================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  disciplines: Discipline[];
  creativeState: CreativeState;
  xpTotal: number;
  level: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  badges: Badge[];
  postCount: number;
  forkCount: number;
}

// ============================================================
// Sparks Module (SP)
// ============================================================

export interface Spark {
  id: string;
  authorId: string;
  author?: User;
  content: string;
  resources: SparkResource[];
  disciplines: Discipline[];
  tags: string[];
  reactionCounts: Record<string, number>;
  forkCount: number;
  parentForkId: string | null;
  createdAt: Date;
}

export interface SparkResource {
  type: "image" | "audio" | "code" | "color-palette" | "text";
  url?: string;
  content?: string;
  language?: string; // For code snippets
  colors?: string[]; // For color palettes
  mimeType?: string;
}

// ============================================================
// WIPs Module (WP)
// ============================================================

export interface WIP {
  id: string;
  authorId: string;
  author?: User;
  title: string;
  description: string;
  currentBlock: string | null;
  status: WIPStatus;
  disciplines: Discipline[];
  tags: string[];
  attachments: Attachment[];
  commentCount: number;
  reactionCounts: Record<string, number>;
  forkCount: number;
  parentForkId: string | null;
  postMortemId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Comment {
  id: string;
  authorId: string;
  author?: User;
  wipId: string;
  content: string;
  codeBlock: string | null;
  codeLanguage: string | null;
  createdAt: Date;
}

// ============================================================
// Post-Mortems Module (PM)
// ============================================================

export interface PostMortem {
  id: string;
  authorId: string;
  author?: User;
  title: string;
  context: string;
  failedAttempts: string;
  solution: string;
  lessonsLearned: string;
  disciplines: Discipline[];
  tags: string[];
  attachments: Attachment[];
  wipOriginId: string | null;
  reactionCounts: Record<string, number>;
  unblockedCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Forking Module (FK)
// ============================================================

export interface Fork {
  id: string;
  forkerId: string;
  forker?: User;
  sourceId: string;
  sourceType: PostType;
  resultId: string;
  resultType: PostType;
  motivation: string;
  createdAt: Date;
}

export interface ForkTreeNode {
  id: string;
  postId: string;
  postType: PostType;
  authorName: string;
  discipline: Discipline;
  children: ForkTreeNode[];
}

// ============================================================
// Gamification Module (KM)
// ============================================================

export interface XPEvent {
  id: string;
  userId: string;
  actionType: string;
  points: number;
  referenceId: string;
  idempotencyKey: string;
  createdAt: Date;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpThreshold: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: Pick<User, "id" | "name" | "avatarUrl" | "level">;
  xpTotal: number;
  badges: Badge[];
}

// ============================================================
// Notifications Module
// ============================================================

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  referenceId: string | null;
  read: boolean;
  createdAt: Date;
}

// ============================================================
// Recommendations Module (RC)
// ============================================================

export interface Recommendation {
  id: string;
  postId: string;
  postType: PostType;
  title: string;
  authorName: string;
  disciplines: Discipline[];
  relevanceScore: number;
}

// ============================================================
// Feed Module (FD)
// ============================================================

export interface FeedItem {
  id: string;
  type: PostType;
  data: Spark | WIP | PostMortem;
  createdAt: Date;
}

export interface FeedFilters {
  discipline?: Discipline;
  postType?: PostType;
  tags?: string[];
  search?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  totalCount?: number;
}

// ============================================================
// Shared / Common
// ============================================================

export interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
}

export interface Reaction {
  id: string;
  userId: string;
  targetId: string;
  targetType: PostType;
  emoji: string;
  createdAt: Date;
}

/** Predefined themed reaction emojis (RF-SP-03) */
export const REACTION_EMOJIS = [
  "🔥", // Fire — love it
  "💡", // Lightbulb — great idea
  "🎯", // Bullseye — on point
  "🚀", // Rocket — impressive
  "🌱", // Seedling — has potential
  "🎨", // Palette — beautiful
  "🎵", // Music — sounds great
  "✍️", // Writing — well written
  "🧩", // Puzzle — clever solution
  "👏", // Clap — well done
] as const;

/** Available disciplines with display metadata */
export const DISCIPLINES: Record<
  Discipline,
  { label: string; labelEs: string; icon: string; color: string }
> = {
  design: {
    label: "Design",
    labelEs: "Diseño",
    icon: "🎨",
    color: "var(--discipline-design)",
  },
  music: {
    label: "Music",
    labelEs: "Música",
    icon: "🎵",
    color: "var(--discipline-music)",
  },
  writing: {
    label: "Writing",
    labelEs: "Escritura",
    icon: "✍️",
    color: "var(--discipline-writing)",
  },
  development: {
    label: "Development",
    labelEs: "Desarrollo",
    icon: "💻",
    color: "var(--discipline-dev)",
  },
  other: {
    label: "Other",
    labelEs: "Otro",
    icon: "✨",
    color: "var(--discipline-other)",
  },
};

/** Post type display metadata */
export const POST_TYPES: Record<
  PostType,
  { label: string; labelEs: string; icon: string; color: string }
> = {
  spark: {
    label: "Spark",
    labelEs: "Spark",
    icon: "⚡",
    color: "var(--spark)",
  },
  wip: {
    label: "WIP",
    labelEs: "WIP",
    icon: "🔧",
    color: "var(--wip)",
  },
  "post-mortem": {
    label: "Post-Mortem",
    labelEs: "Post-Mortem",
    icon: "📝",
    color: "var(--postmortem)",
  },
};
