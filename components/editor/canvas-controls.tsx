"use client";

import { useReactFlow } from "@xyflow/react";
import { Maximize2, Minus, Plus, Redo2, Undo2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface CanvasControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

interface ControlButtonProps {
  onClick: () => void;
  title: string;
  icon: LucideIcon;
  disabled?: boolean;
}

function ControlButton({
  onClick,
  title,
  icon: Icon,
  disabled = false,
}: ControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="flex h-7 w-7 items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-accent-dim hover:text-copy-primary disabled:pointer-events-none disabled:opacity-35"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

const ZOOM_DURATION = 200;

/**
 * Pill-shaped floating control bar pinned to the bottom-left of the canvas,
 * above the shape panel. Left group: zoom out / fit view / zoom in. Right
 * group (after a divider): undo / redo. Undo and redo drive the collaborative
 * Liveblocks history and dim when there is nothing to undo/redo.
 */
export function CanvasControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <div className="pointer-events-none absolute bottom-4 left-4 z-10">
      <div className="pointer-events-auto flex items-center rounded-full border border-surface-border bg-surface/95 p-1 shadow-lg backdrop-blur-md">
        <ControlButton
          onClick={() => zoomOut({ duration: ZOOM_DURATION })}
          title="Zoom out (−)"
          icon={Minus}
        />
        <ControlButton
          onClick={() => fitView({ duration: ZOOM_DURATION + 50 })}
          title="Fit view"
          icon={Maximize2}
        />
        <ControlButton
          onClick={() => zoomIn({ duration: ZOOM_DURATION })}
          title="Zoom in (+)"
          icon={Plus}
        />
        <span aria-hidden className="mx-1 h-4 w-px bg-surface-border" />
        <ControlButton
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (⌘/Ctrl+Z)"
          icon={Undo2}
        />
        <ControlButton
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (⌘/Ctrl+Shift+Z / ⌘/Ctrl+Y)"
          icon={Redo2}
        />
      </div>
    </div>
  );
}