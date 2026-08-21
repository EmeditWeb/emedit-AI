"use client";

import { useEffect } from "react";
import type { Edge, Node, ReactFlowInstance } from "@xyflow/react";

interface UseKeyboardShortcutsOptions<
  N extends Node = Node,
  E extends Edge = Edge,
> {
  /** The React Flow instance whose `zoomIn`/`zoomOut` will be triggered. */
  flow: ReactFlowInstance<N, E> | null;
  /** Undo handler (Liveblocks history). */
  onUndo: () => void;
  /** Redo handler (Liveblocks history). */
  onRedo: () => void;
  /** Set to `false` to temporarily disable the shortcuts. */
  enabled?: boolean;
}

const ZOOM_DURATION = 200;

/**
 * Global canvas keyboard shortcuts:
 *   + / =  zoom in
 *   -      zoom out
 *   Cmd/Ctrl+Z           undo
 *   Cmd/Ctrl+Shift+Z     redo
 *   Cmd/Ctrl+Y           redo
 *
 * Shortcuts are ignored while focus is inside an input, textarea, or a
 * content-editable element so typing is never hijacked.
 */
export function useKeyboardShortcuts<
  N extends Node = Node,
  E extends Edge = Edge,
>({
  flow,
  onUndo,
  onRedo,
  enabled = true,
}: UseKeyboardShortcutsOptions<N, E>) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (mod) {
        if (key === "z") {
          event.preventDefault();
          if (event.shiftKey) {
            onRedo();
          } else {
            onUndo();
          }
        } else if (key === "y") {
          event.preventDefault();
          onRedo();
        }
        return;
      }

      if (key === "+" || key === "=") {
        event.preventDefault();
        flow?.zoomIn({ duration: ZOOM_DURATION });
      } else if (key === "-") {
        event.preventDefault();
        flow?.zoomOut({ duration: ZOOM_DURATION });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, flow, onUndo, onRedo]);
}