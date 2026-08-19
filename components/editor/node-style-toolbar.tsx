"use client";

import { NodeToolbar, Position } from "@xyflow/react";
import { useState } from "react";

import type { NodeColorPair } from "@/types/canvas";
import { ColorSwatches } from "./color-swatches";
import { FontSelect } from "./font-select";

const FONT_SIZE_MIN = 8;
const FONT_SIZE_MAX = 96;

interface NodeStyleToolbarProps {
  font: string;
  fontSize: number;
  fallbackFontSize: number;
  activeColor: string;
  onChangeFont: (font: string) => void;
  onChangeFontSize: (fontSize: number) => void;
  onChangeColor: (pair: NodeColorPair) => void;
}

/** Floating style bar shown above a selected node: font, size, color theme. */
export function NodeStyleToolbar({
  font,
  fontSize,
  fallbackFontSize,
  activeColor,
  onChangeFont,
  onChangeFontSize,
  onChangeColor,
}: NodeStyleToolbarProps) {
  const [sizeDraft, setSizeDraft] = useState<string | null>(null);
  const sizeValue = sizeDraft ?? String(fontSize);

  const commitFontSize = (draft: string) => {
    const trimmed = draft.trim();
    const parsed = trimmed === "" ? Number.NaN : Number(trimmed);
    const next = Number.isFinite(parsed)
      ? Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, parsed))
      : fallbackFontSize;
    onChangeFontSize(next);
    setSizeDraft(null);
  };

  return (
    <NodeToolbar isVisible position={Position.Top} offset={10}>
      <div
        className="nodrag nopan flex items-center gap-1.5 rounded-full border border-surface-border bg-surface/95 px-2 py-1 shadow-lg backdrop-blur-md"
        style={{ fontFamily: "var(--font-geist-sans)" }}
        onMouseDown={(event) => event.stopPropagation()}
        onDoubleClick={(event) => event.stopPropagation()}
      >
        <span className="text-[9px] font-medium uppercase tracking-wide text-copy-muted">
          Font
        </span>
        <FontSelect value={font} onChange={onChangeFont} />
        <span className="text-[9px] font-medium uppercase tracking-wide text-copy-muted">
          Size
        </span>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={sizeValue}
          title="Node font size (px)"
          aria-label="Node font size in pixels"
          onFocus={(event) => {
            setSizeDraft(sizeValue);
            event.currentTarget.select();
          }}
          onChange={(event) => setSizeDraft(event.target.value)}
          onBlur={() => {
            if (sizeDraft !== null) commitFontSize(sizeDraft);
          }}
          onKeyDown={(event) => {
            event.stopPropagation();
            if (event.key === "Enter") {
              if (sizeDraft !== null) commitFontSize(sizeDraft);
              event.currentTarget.blur();
            } else if (event.key === "Escape") {
              setSizeDraft(null);
              event.currentTarget.blur();
            }
          }}
          className="nodrag nopan h-6 w-8 rounded-full border border-surface-border bg-base text-center text-[11px] leading-none text-copy-primary outline-none focus:border-brand"
        />
        <span aria-hidden className="h-4 w-px bg-surface-border" />
        <ColorSwatches activeColor={activeColor} onSelect={onChangeColor} />
      </div>
    </NodeToolbar>
  );
}
