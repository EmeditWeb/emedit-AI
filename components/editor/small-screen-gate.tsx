"use client";

import { Monitor } from "lucide-react";
import { useEffect, useState } from "react";

/**
 * The canvas workspace needs pointer precision and screen area that narrow
 * viewports cannot provide, so below this width the editor is blocked outright
 * rather than shipped in a state where controls overlap and drags misfire.
 */
export const WORKSPACE_MIN_WIDTH = 1024;

/**
 * Tracks whether the viewport is under the workspace minimum.
 * Starts `null` so the first client render matches the server output and
 * hydration does not mismatch.
 */
export function useIsBelowMinWidth(): boolean | null {
  const [isBelow, setIsBelow] = useState<boolean | null>(null);

  useEffect(() => {
    const query = window.matchMedia(
      `(max-width: ${WORKSPACE_MIN_WIDTH - 1}px)`,
    );
    const sync = () => setIsBelow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  return isBelow;
}

/**
 * Full-screen blocker shown while the viewport is too narrow to use the
 * workspace. It is not dismissible: it clears itself as soon as the window is
 * widened past the minimum.
 */
export function SmallScreenGate() {
  const isBelow = useIsBelowMinWidth();

  if (isBelow !== true) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="small-screen-gate-title"
      aria-describedby="small-screen-gate-body"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-base/95 p-6 backdrop-blur-md"
    >
      <div className="flex w-full max-w-sm flex-col items-center gap-4 rounded-2xl border border-surface-border bg-surface/80 p-6 text-center shadow-2xl shadow-black/40">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ai/30 bg-ai/10">
          <Monitor className="h-6 w-6 text-ai-text" />
        </div>
        <h2
          id="small-screen-gate-title"
          className="text-lg font-semibold text-copy-primary"
        >
          Switch to a wider screen
        </h2>
        <p
          id="small-screen-gate-body"
          className="text-sm leading-relaxed text-copy-muted"
        >
          The workspace canvas needs at least {WORKSPACE_MIN_WIDTH}px of width
          to work properly. Open this project on a desktop, or widen your
          browser window, to keep editing.
        </p>
      </div>
    </div>
  );
}
