"use client";

import { Handle, NodeResizer, Position, type NodeProps } from "@xyflow/react";
import { Trash2 } from "lucide-react";
import { useRef, useState, type KeyboardEvent, type MouseEvent } from "react";

import type { CanvasNode, NodeColorPair } from "@/types/canvas";
import { DEFAULT_FONT_KEY, fontCssVar } from "./canvas-fonts";
import { NodeStyleToolbar } from "./node-style-toolbar";
import { ShapeOutline } from "./shape-outline";

const MIN_NODE_WIDTH = 60;
const MIN_NODE_HEIGHT = 40;
const HANDLE_COLOR = "rgba(0, 200, 212, 0.9)";
const RESIZE_HANDLE_COLOR = "rgba(0, 200, 212, 0.8)";
const HANDLE_DOT = 7;
const HANDLE_HIT = 16;
const FONT_SLOPE = 1 / 11;

const scaleFont = (width: number) =>
  Math.max(9, Math.round(width * FONT_SLOPE));

/**
 * Handles stay invisible until the node is selected, but keep their pointer
 * events so a connection can still be dragged off an unselected node. The
 * element is a 16px grab target with the visible 7px dot painted by a radial
 * gradient — a 7px hit area is far too small to reliably start a connection.
 */
const handleStyle = (selected: boolean) => ({
  width: HANDLE_HIT,
  height: HANDLE_HIT,
  minWidth: HANDLE_HIT,
  minHeight: HANDLE_HIT,
  border: "none",
  borderRadius: "9999px",
  background: `radial-gradient(circle at center, ${HANDLE_COLOR} 0 ${
    HANDLE_DOT / 2
  }px, rgba(8, 8, 12, 0.9) ${HANDLE_DOT / 2}px ${
    HANDLE_DOT / 2 + 1
  }px, transparent ${HANDLE_DOT / 2 + 1}px)`,
  opacity: selected ? 1 : 0,
  transition: "opacity 150ms ease",
});

interface CanvasNodeRendererProps extends NodeProps<CanvasNode> {
  isEditing?: boolean;
  onStartEdit?: (id: string, label: string) => void;
  onChangeLabel?: (id: string, label: string) => void;
  onChangeFont?: (id: string, font: string) => void;
  onChangeFontSize?: (id: string, fontSize: number) => void;
  onChangeColor?: (id: string, pair: NodeColorPair) => void;
  onEndEdit?: (id: string, label: string) => void;
  onDeleteNode?: (id: string) => void;
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
  onChangeColor,
  onEndEdit,
  onDeleteNode,
}: CanvasNodeRendererProps) {
  const isTextNode = data.shape === "text";
  const autoFontSize = scaleFont(width ?? 0);
  const fontSize = data.fontSize ?? autoFontSize;
  const fontFamily = fontCssVar(data.font ?? DEFAULT_FONT_KEY);
  const textColor = data.color;

  const [hovered, setHovered] = useState(false);
  const hoverTimerRef = useRef<number | null>(null);
  const showHover = () => {
    if (hoverTimerRef.current !== null) {
      window.clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setHovered(true);
  };
  const hideHover = () => {
    if (hoverTimerRef.current !== null) window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = window.setTimeout(() => setHovered(false), 160);
  };
  const showDelete = selected || hovered;
  const showHandles = selected || hovered;

  const handles: Array<{
    id: string;
    type: "source" | "target";
    position: Position;
  }> = [
    { id: "handle-top", type: "target", position: Position.Top },
    { id: "handle-left", type: "target", position: Position.Left },
    { id: "handle-bottom", type: "source", position: Position.Bottom },
    { id: "handle-right", type: "source", position: Position.Right },
  ];

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
      onMouseEnter={showHover}
      onMouseLeave={hideHover}
    >
      <NodeResizer
        isVisible={selected}
        keepAspectRatio={!isTextNode}
        minWidth={MIN_NODE_WIDTH}
        minHeight={MIN_NODE_HEIGHT}
        color={RESIZE_HANDLE_COLOR}
        lineStyle={{ borderColor: "transparent" }}
        handleStyle={{
          width: HANDLE_DOT,
          height: HANDLE_DOT,
          borderRadius: "9999px",
          borderColor: HANDLE_COLOR,
        }}
      />
      {!isTextNode ? (
        <ShapeOutline
          shape={data.shape}
          color={data.color}
          bg={data.bg}
          selected={selected}
        />
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
      {handles.map((handle) => (
        <Handle
          key={handle.id}
          id={handle.id}
          type={handle.type}
          position={handle.position}
          isConnectableStart
          isConnectableEnd
          style={handleStyle(showHandles)}
        />
      ))}
      {selected ? (
        <NodeStyleToolbar
          font={data.font ?? DEFAULT_FONT_KEY}
          fontSize={fontSize}
          fallbackFontSize={autoFontSize}
          activeColor={data.color}
          onChangeFont={(font) => onChangeFont?.(id, font)}
          onChangeFontSize={(next) => onChangeFontSize?.(id, next)}
          onChangeColor={(pair) => onChangeColor?.(id, pair)}
        />
      ) : null}
      <button
        type="button"
        aria-label="Delete node"
        title="Delete node"
        onMouseEnter={showHover}
        onMouseLeave={hideHover}
        onMouseDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onDeleteNode?.(id);
        }}
        onDoubleClick={(event) => event.stopPropagation()}
        className={`nodrag nopan absolute z-[10] flex h-6 w-6 items-center justify-center rounded-full border border-surface-border bg-surface/95 text-copy-muted shadow-md backdrop-blur-md transition-all duration-150 hover:border-destructive/60 hover:bg-destructive hover:text-white ${
          showDelete
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ right: -6, top: "calc(100% - 18px)" }}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}