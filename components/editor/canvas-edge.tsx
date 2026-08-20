"use client";

import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  Position,
  type EdgeProps,
} from "@xyflow/react";
import { useState, type KeyboardEvent } from "react";

import type { CanvasEdge } from "@/types/canvas";

const isVerticalPosition = (position: Position | undefined) =>
  position === Position.Top || position === Position.Bottom;

interface CanvasEdgeComponentProps extends EdgeProps<CanvasEdge> {
  isEditing?: boolean;
  onStartEdit?: () => void;
  onCommitLabel?: (label: string) => void;
}

/**
 * Custom edge that renders its label with `EdgeLabelRenderer` anchored to the
 * midpoint of the path. The label lives on `edge.data.label` and is edited
 * inline; changes flow back through the collaborative replace-change path.
 */
export function CanvasEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  isEditing = false,
  data,
  onStartEdit,
  onCommitLabel,
}: CanvasEdgeComponentProps) {
  const [edgePath, labelX, labelY] =
    isVerticalPosition(sourcePosition) && isVerticalPosition(targetPosition)
      ? getSmoothStepPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
          borderRadius: 8,
        })
      : getBezierPath({
          sourceX,
          sourceY,
          sourcePosition,
          targetX,
          targetY,
          targetPosition,
        });

  const [draft, setDraft] = useState<string | null>(null);
  const label = data?.label ?? "";

  const commit = () => {
    onCommitLabel?.((draft ?? label).trim());
    setDraft(null);
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          className="nodrag nopan pointer-events-none absolute z-[5]"
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {isEditing ? (
            <input
              autoFocus
              spellCheck={false}
              aria-label="Edit edge label"
              placeholder="Edge label…"
              value={draft ?? label}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={commit}
              onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                if (event.key === "Enter") {
                  commit();
                  event.currentTarget.blur();
                } else if (event.key === "Escape") {
                  setDraft(null);
                  event.currentTarget.blur();
                }
              }}
              className="pointer-events-auto nopan nodrag h-6 min-w-[6rem] rounded-full border border-brand bg-surface/95 px-2 text-[11px] text-copy-primary outline-none focus:border-brand"
            />
          ) : label ? (
            <span
              tabIndex={-1}
              onDoubleClick={onStartEdit}
              className={`pointer-events-auto inline-flex h-5 max-w-[14rem] cursor-pointer items-center rounded-full border border-surface-border bg-surface/95 px-2 text-[10px] text-copy-primary shadow-sm backdrop-blur-md hover:border-brand/60 ${
                selected ? "border-brand/60" : ""
              }`}
              title={label}
            >
              <span className="truncate">{label}</span>
            </span>
          ) : selected ? (
            <button
              type="button"
              onDoubleClick={onStartEdit}
              className="pointer-events-auto inline-flex h-5 items-center rounded-full border border-surface-border bg-surface/95 px-2 text-[10px] text-copy-muted shadow-sm backdrop-blur-md hover:border-brand/60 hover:text-copy-primary"
              title="Add edge label"
            >
              + label
            </button>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}