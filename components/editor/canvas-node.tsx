"use client";

import {
  Handle,
  NodeResizer,
  NodeToolbar,
  Position,
  type NodeProps,
} from "@xyflow/react";
import { useState, type KeyboardEvent, type MouseEvent } from "react";

import type { CanvasNode } from "@/types/canvas";
import { CANVAS_FONTS, DEFAULT_FONT_KEY, fontCssVar } from "./canvas-fonts";
import { ShapeOutline } from "./shape-outline";

const MIN_NODE_WIDTH = 60;
const MIN_NODE_HEIGHT = 40;
const HANDLE_COLOR = "rgba(0, 200, 212, 0.9)";
const RESIZE_HANDLE_COLOR = "rgba(0, 200, 212, 0.8)";
const FONT_SLOPE = 1 / 11;
const FONT_SIZE_MIN = 8;
const FONT_SIZE_MAX = 96;

const scaleFont = (width: number) =>
  Math.max(9, Math.round(width * FONT_SLOPE));

interface CanvasNodeRendererProps extends NodeProps<CanvasNode> {
  isEditing?: boolean;
  onStartEdit?: (id: string, label: string) => void;
  onChangeLabel?: (id: string, label: string) => void;
  onChangeFont?: (id: string, font: string) => void;
  onChangeFontSize?: (id: string, fontSize: number) => void;
  onEndEdit?: (id: string, label: string) => void;
}

export function CanvasNodeRenderer({
  id,
  data,
  width,
  selected,
  isEditing = false,
  onStartEdit,
  onChangeLabel,
  onChangeFont,
  onChangeFontSize,
  onEndEdit,
}: CanvasNodeRendererProps) {
  const isTextNode = data.shape === "text";
  const autoFontSize = scaleFont(width ?? 0);
  const fontSize = data.fontSize ?? autoFontSize;
  const fontFamily = fontCssVar(data.font ?? DEFAULT_FONT_KEY);
  const textColor = isTextNode ? data.color : undefined;

  const [sizeDraft, setSizeDraft] = useState<string | null>(null);
  const sizeValue = sizeDraft ?? String(fontSize);

  const commitFontSize = (draft: string) => {
    const trimmed = draft.trim();
    const parsed = trimmed === "" ? Number.NaN : Number(trimmed);
    const next = Number.isFinite(parsed)
      ? Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, parsed))
      : autoFontSize;
    onChangeFontSize?.(id, next);
    setSizeDraft(null);
  };

  const startLabelEdit = (event: MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    onStartEdit?.(id, data.label);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    event.stopPropagation();
    if (event.key === "Escape") {
      event.preventDefault();
      onEndEdit?.(id, data.label);
    }
  };

  return (
    <div
      className="relative h-full w-full"
      onDoubleClick={startLabelEdit}
    >
      <NodeResizer
        isVisible={selected}
        keepAspectRatio={!isTextNode}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color={RESIZE_HANDLE_COLOR}
        handleStyle={{ borderColor: HANDLE_COLOR }}
      />
      {!isTextNode ? (
        <>
          <Handle
            type="target"
            id="target-top"
            position={Position.Top}
            style={{ backgroundColor: HANDLE_COLOR, borderColor: HANDLE_COLOR }}
          />
          <Handle
            type="target"
            id="target-left"
            position={Position.Left}
            style={{ backgroundColor: HANDLE_COLOR, borderColor: HANDLE_COLOR }}
          />
          <ShapeOutline
            shape={data.shape}
            color={data.color}
            selected={selected}
          />
        </>
      ) : null}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center px-3 text-center font-medium text-copy-primary"
        style={{
          color: textColor,
          fontSize,
          lineHeight: 1.2,
          overflow: "hidden",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
          fontFamily,
        }}
      >
        <span
          className="pointer-events-auto nodrag nopan select-text cursor-text"
          style={{ fontFamily }}
        >
          {data.label}
        </span>
      </div>
      {isEditing ? (
        <div className="absolute inset-0 z-[5] flex items-center justify-center px-3">
          <textarea
            autoFocus
            spellCheck={false}
            value={data.label}
            placeholder="Enter label…"
            onChange={(event) => onChangeLabel?.(id, event.target.value)}
            onBlur={() => onEndEdit?.(id, data.label)}
            onKeyDown={handleKeyDown}
            className="no-scrollbar nopan nowheel nodrag block w-full resize-none rounded-md border border-dashed border-brand/50 bg-surface/95 text-center text-copy-primary outline-none focus:border-brand"
            style={{
              color: textColor,
              fontSize,
              lineHeight: 1.2,
              wordBreak: "break-word",
              whiteSpace: "pre-wrap",
              fontFamily,
            }}
          />
        </div>
      ) : null}
      {!isTextNode ? (
        <>
          <Handle
            type="source"
            id="source-bottom"
            position={Position.Bottom}
            style={{ backgroundColor: HANDLE_COLOR, borderColor: HANDLE_COLOR }}
          />
          <Handle
            type="source"
            id="source-right"
            position={Position.Right}
            style={{ backgroundColor: HANDLE_COLOR, borderColor: HANDLE_COLOR }}
          />
        </>
      ) : null}
      {selected ? (
        <NodeToolbar isVisible position={Position.Top} offset={8}>
          <div className="flex items-center gap-1 rounded-xl border border-surface-border bg-surface/95 p-1 shadow-lg backdrop-blur-md">
            <span className="pl-2 text-[10px] font-medium uppercase tracking-wide text-copy-muted">
              Font
            </span>
            <select
              value={data.font ?? DEFAULT_FONT_KEY}
              onChange={(event) => onChangeFont?.(id, event.target.value)}
              className="nopan nodrag h-8 cursor-pointer rounded-lg border border-surface-border bg-base px-2 text-xs text-copy-primary outline-none focus:border-brand"
              style={{ fontFamily: "var(--font-geist-sans)" }}
              title="Node font"
            >
              {CANVAS_FONTS.map((option) => (
                <option
                  key={option.key}
                  value={option.key}
                  style={{ fontFamily: option.cssVar }}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <span className="ml-1 border-l border-surface-border pl-2 text-[10px] font-medium uppercase tracking-wide text-copy-muted">
              Size
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={sizeValue}
              onFocus={(event) => {
                setSizeDraft(sizeValue);
                event.currentTarget.select();
              }}
              onChange={(event) => setSizeDraft(event.target.value)}
              onBlur={() => {
                if (sizeDraft !== null) commitFontSize(sizeDraft);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  if (sizeDraft !== null) commitFontSize(sizeDraft);
                  event.currentTarget.blur();
                } else if (event.key === "Escape") {
                  setSizeDraft(null);
                  event.currentTarget.blur();
                }
              }}
              className="nopan nodrag h-8 w-16 rounded-lg border border-surface-border bg-base px-2 text-xs text-copy-primary outline-none focus:border-brand"
              title="Node font size (px)"
            />
          </div>
        </NodeToolbar>
      ) : null}
    </div>
  );
}