import { NextResponse } from "next/server";

/**
 * Lightweight in-memory fixed-window rate limiter keyed by identity + scope.
 *
 * Suitable for a single-instance deployment (the dev server and the production
 * Node server here run one process). Each window starts at the first request in
 * that window; excess requests get a 429 until the window rolls over.
 */

interface RateLimitWindow {
  count: number;
  resetAt: number;
}

const windows = new Map<string, RateLimitWindow>();
const MAX_ENTRIES = 10_000;

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

/** Per-scope budgets. Reads are generous; mutations are tight. */
export const RATE_LIMITS = {
  read: { limit: 60, windowMs: 60_000 },
  list: { limit: 120, windowMs: 60_000 },
  mutate: { limit: 20, windowMs: 60_000 },
  liveblocks: { limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitScope = keyof typeof RATE_LIMITS;

export function checkRateLimit(
  key: string,
  scope: RateLimitScope,
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const { limit, windowMs } = RATE_LIMITS[scope];
  const now = Date.now();

  if (windows.size >= MAX_ENTRIES) {
    for (const [existingKey, entry] of windows) {
      if (entry.resetAt <= now) windows.delete(existingKey);
    }
  }

  let entry = windows.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    windows.set(key, entry);
  }

  entry.count += 1;
  if (entry.count > limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((entry.resetAt - now) / 1000),
      ),
    };
  }
  return { ok: true };
}

export function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    { error: "Too many requests" },
    {
      status: 429,
      headers: { "Retry-After": String(retryAfterSeconds) },
    },
  );
}

/**
 * Gate a request: returns a 429 response when the caller has exhausted its
 * budget for the scope, or null to let the handler proceed. Call this right
 * after the auth gate so only signed-in identities are admitted.
 */
export function gateRequest(
  key: string,
  scope: RateLimitScope,
): NextResponse | null {
  const result = checkRateLimit(key, scope);
  if (!result.ok) {
    return rateLimitResponse(result.retryAfterSeconds);
  }
  return null;
}