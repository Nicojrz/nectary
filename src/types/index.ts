/**
 * Nectary — Shared TypeScript Type Definitions
 *
 * This file contains all shared types used across the application.
 * Types are organized by module to match the requirements document.
 *
 * NOTE: Platform scope is exclusively for writers.
 * Literary categories replace the old multi-discipline system.
 */

// ============================================================
// Enums
// ============================================================

/** Types of publications on the platform */
export type PostType = "spark" | "wip" | "post-mortem";

/**
 * Literary categories for writers (CU-SP-01, CU-WP-01).
 * Replaces the old multi-discipline system — platform is writing-only.
 */
export type LiteraryCategory = "cuento" | "poesia" | "novela" | "ensayo";

/** WIP status states (CU-WP-03) */
export type WIPStatus = "blocked" | "in-progress" | "resolved";

/** Creative state of a user (CU-FD-01) */
export type CreativeState = "flow" | "mild" | "severe";

/** Notification types */
export type NotificationType =
  | "comment"
  | "fork"
  | "like"
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
  /** Literary categories the user is interested in */
  categories: LiteraryCategory[];
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

/**
 * Spark: short-form text post capturing a creative idea or fragment.
 * Content is plain text only (CU-SP-01).
 * Must have at least one literary category tag (CU-SP-01 — A3).
 */
export interface Spark {
  id: string;
  authorId: string;
  author?: User;
  /** Plain text content only — no rich media (CU-SP-01) */
  content: string;
  /** At least one category required to publish (CU-SP-01 — A3) */
  categories: LiteraryCategory[];
  tags: string[];
  likes: number;
  forkCount: number;
  parentForkId: string | null;
  createdAt: Date;
}

// ============================================================
// WIPs Module (WP)
// ============================================================

/**
 * WIP: an in-progress writing project.
 * Content is plain text only (CU-WP-01).
 */
export interface WIP {
  id: string;
  authorId: string;
  author?: User;
  title: string;
  /** Description of writing progress — plain text only */
  description: string;
  /** Current creative block the author is experiencing */
  currentBlock: string | null;
  status: WIPStatus;
  categories: LiteraryCategory[];
  tags: string[];
  commentCount: number;
  likes: number;
  forkCount: number;
  parentForkId: string | null;
  /** Linked post-mortem once WIP is resolved (CU-WP-03) */
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
  createdAt: Date;
}

// ============================================================
// Post-Mortems Module (PM)
// ============================================================

/**
 * Post-Mortem: structured reflection on a resolved creative block.
 * Has four required sections (CU-PM-01).
 * Rendered via SSG/ISR and tagged with Open Graph metadata (CU-PM-01).
 */
export interface PostMortem {
  id: string;
  authorId: string;
  author?: User;
  title: string;
  /** Section 1: background and context of the project */
  context: string;
  /** Section 2: approaches that did not work */
  failedAttempts: string;
  /** Section 3: what ultimately worked */
  solution: string;
  /** Section 4: key takeaways */
  lessonsLearned: string;
  categories: LiteraryCategory[];
  tags: string[];
  /** Linked WIP origin (optional — CU-PM-01 A1) */
  wipOriginId: string | null;
  likes: number;
  /** Counter for "Me desbloqueó" reactions (CU-PM-01) */
  unblockedCount: number;
  /** Version tracking for edit history (CU-PM-01 A2) */
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================
// Forking Module (FK)
// ============================================================

/**
 * Fork: a derivative idea created from a Spark or WIP.
 * Motivation text is mandatory (CU-FK-01 — A1).
 * Fork tree persists even if original is deleted (CU-FK-01 — A2).
 */
export interface Fork {
  id: string;
  forkerId: string;
  forker?: User;
  sourceId: string;
  sourceType: PostType;
  resultId: string;
  resultType: PostType;
  /** Required motivation text (CU-FK-01 — A1) */
  motivation: string;
  createdAt: Date;
}

export interface ForkTreeNode {
  id: string;
  postId: string;
  postType: PostType;
  authorName: string;
  /** Null if original was deleted (CU-FK-01 — A2) */
  originalDeleted: boolean;
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
// Feed Module (FD)
// ============================================================

export interface FeedItem {
  id: string;
  type: PostType;
  data: Spark | WIP | PostMortem;
  createdAt: Date;
}

export interface FeedFilters {
  category?: LiteraryCategory;
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

export interface Like {
  id: string;
  userId: string;
  targetId: string;
  targetType: PostType;
  createdAt: Date;
}

/** Literary categories with display metadata */
export const LITERARY_CATEGORIES: Record<
  LiteraryCategory,
  { label: string; labelEs: string; color: string }
> = {
  cuento: {
    label: "Short Story",
    labelEs: "Cuento",
    color: "var(--category-cuento)",
  },
  poesia: {
    label: "Poetry",
    labelEs: "Poesía",
    color: "var(--category-poesia)",
  },
  novela: {
    label: "Novel",
    labelEs: "Novela",
    color: "var(--category-novela)",
  },
  ensayo: {
    label: "Essay",
    labelEs: "Ensayo",
    color: "var(--category-ensayo)",
  },
};

/** Post type display metadata */
export const POST_TYPES: Record<
  PostType,
  { label: string; labelEs: string; color: string }
> = {
  spark: {
    label: "Spark",
    labelEs: "Spark",
    color: "var(--spark)",
  },
  wip: {
    label: "WIP",
    labelEs: "WIP",
    color: "var(--wip)",
  },
  "post-mortem": {
    label: "Post-Mortem",
    labelEs: "Post-Mortem",
    color: "var(--postmortem)",
  },
};

/** Creative state display metadata */
export const CREATIVE_STATES: Record<
  CreativeState,
  { label: string; labelEs: string; color: string }
> = {
  flow: {
    label: "Flow",
    labelEs: "En flujo",
    color: "var(--flow)",
  },
  mild: {
    label: "Mild Block",
    labelEs: "Bloqueo Leve",
    color: "var(--mild)",
  },
  severe: {
    label: "Severe Block",
    labelEs: "Bloqueo Severo",
    color: "var(--severe)",
  },
};
