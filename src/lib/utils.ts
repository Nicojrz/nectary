import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS class names.
 * Combines clsx for conditional classes and twMerge for resolving tailwind conflicts.
 *
 * Usage:
 *   import { cn } from "@/lib/utils";
 *   <div className={cn("base-class", isActive && "active-class")} />
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date relative to now (e.g., "2h ago", "3d ago").
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  return `${diffMonths}mo ago`;
}

/**
 * Truncate text to a specified length with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Generate an idempotency key for XP events (RNF-KM-01).
 */
export function generateXPIdempotencyKey(
  actionType: string,
  actorId: string,
  targetId: string
): string {
  return `${actionType}:${actorId}:${targetId}`;
}

/**
 * Calculate user level from total XP.
 * Uses a simple quadratic curve: level = floor(sqrt(xp / 100))
 */
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

/**
 * XP required for next level.
 */
export function xpForNextLevel(currentLevel: number): number {
  return Math.pow(currentLevel, 2) * 100;
}

/**
 * XP progress percentage within current level.
 */
export function xpProgress(xp: number): number {
  const level = calculateLevel(xp);
  const currentLevelXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  return ((xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100;
}

/**
 * Validate file size against a maximum (in bytes).
 * Returns true if the file is within the limit.
 */
export function isFileSizeValid(
  fileSize: number,
  maxSizeMB: number
): boolean {
  return fileSize <= maxSizeMB * 1024 * 1024;
}

/** Max file sizes in MB (RNF-SP-01) */
export const FILE_LIMITS = {
  IMAGE_MAX_MB: 5,
  AUDIO_MAX_MB: 10,
  ATTACHMENT_MAX_MB: 25,
} as const;

/** Supported audio formats (RNF-SP-02) */
export const SUPPORTED_AUDIO_FORMATS = ["audio/mpeg", "audio/wav"] as const;

/** Spark content character limit */
export const SPARK_CHAR_LIMIT = 500;
