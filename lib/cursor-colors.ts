/** Vivid, distinguishable cursor/avatar colors on the dark canvas. */
export const CURSOR_COLORS: ReadonlyArray<string> = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#10b981",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#d946ef",
  "#ec4899",
  "#14b8a6",
];

/**
 * Liveblocks assigns each active connection a unique per-room `connectionId`.
 * Mapping that to a palette entry gives every concurrent user a distinct trail
 * color without relying on a (collidable) hash of the user id.
 */
export function cursorColorForConnection(connectionId: number): string {
  return CURSOR_COLORS[connectionId % CURSOR_COLORS.length];
}