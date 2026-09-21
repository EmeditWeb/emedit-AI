"use client";

import { Shapes } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type RefObject,
  type WheelEvent,
} from "react";

import {
  NODE_SHAPES,
  SHAPE_DEFAULT_SIZES,
  type CanvasNodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

import { ShapeOutline } from "./shape-outline";

/**
 * The rack keeps a fixed footprint no matter how large the shape library grows
 * — extra shapes are reachable by sliding it, or by opening the full library
 * with the button on its right.
 */
const RACK_MAX_WIDTH = "min(70vw, 540px)";

interface ShapePanelProps {
  onDragStart: (
    event: DragEvent<HTMLButtonElement>,
    payload: ShapeDragPayload,
  ) => void;
  /** How many nodes of each shape are currently on the canvas. */
  counts: Partial<Record<CanvasNodeShape, number>>;
}

const payloadFor = (shape: CanvasNodeShape): ShapeDragPayload => ({
  shape,
  ...SHAPE_DEFAULT_SIZES[shape],
});

const shapeAriaLabel = (label: string, count: number) =>
  count > 0 ? `Drag ${label}, ${count} on canvas` : `Drag ${label}`;

const FADE = 24;

/**
 * Fades the rack's content out at whichever edge is still overflowing, so a
 * hidden shape reads as "slide me" rather than as nothing.
 */
function edgeMask({ left, right }: { left: boolean; right: boolean }) {
  if (!left && !right) return undefined;
  const stops: string[] = [];
  if (left) stops.push("transparent 0", `black ${FADE}px`);
  if (right) stops.push(`black calc(100% - ${FADE}px)`, "transparent 100%");
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/** The count marker, sitting on the shape's bottom-right corner. */
function ShapeMarker({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute -right-1 -bottom-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-semibold text-black tabular-nums ring-2 ring-surface"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/**
 * Keeps a horizontally scrollable rack usable with a plain mouse wheel, and
 * reports which edges are still overflowing so they can be masked.
 */
function useRackScroll(ref: RefObject<HTMLDivElement | null>) {
  const [edges, setEdges] = useState({ left: false, right: false });

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = {
      left: el.scrollLeft > 1,
      right: max > 1 && el.scrollLeft < max - 1,
    };
    setEdges((current) =>
      current.left === next.left && current.right === next.right
        ? current
        : next,
    );
  }, [ref]);

  useEffect(() => {
    sync();
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync, ref]);

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    const delta = event.deltaY !== 0 ? event.deltaY : event.deltaX;
    if (delta === 0) return;
    el.scrollLeft += delta;
  };

  return { edges, onWheel, onScroll: sync };
}

export function ShapePanel({ onDragStart, counts }: ShapePanelProps) {
  const [expanded, setExpanded] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const rackRef = useRef<HTMLDivElement | null>(null);
  const rack = useRackScroll(rackRef);

  // Same dismissal contract as the font picker: outside pointer or Escape.
  useEffect(() => {
    if (!expanded) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) setExpanded(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [expanded]);

  const startDrag = (
    event: DragEvent<HTMLButtonElement>,
    shape: CanvasNodeShape,
  ) => {
    // Collapse first so the canvas is unobstructed while dragging onto it.
    setExpanded(false);
    onDragStart(event, payloadFor(shape));
  };

  return (
    <div
      ref={panelRef}
      className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2"
    >
      {expanded ? (
        <div
          id="shape-library"
          className="pointer-events-auto absolute bottom-[calc(100%+8px)] left-1/2 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-surface-border bg-surface/95 p-2 shadow-xl backdrop-blur-md"
        >
          <div className="grid grid-cols-6 gap-1">
            {NODE_SHAPES.map(({ shape, label }) => {
              const count = counts[shape] ?? 0;
              return (
                <button
                  key={shape}
                  type="button"
                  draggable
                  onDragStart={(event) => startDrag(event, shape)}
                  title={shapeAriaLabel(label, count)}
                  aria-label={shapeAriaLabel(label, count)}
                  className="flex w-16 cursor-grab flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-copy-muted transition-colors hover:bg-accent-dim hover:text-copy-primary active:cursor-grabbing"
                >
                  <span className="relative block h-6 w-6">
                    <ShapeOutline
                      shape={shape}
                      color="var(--text-secondary)"
                      bg="transparent"
                    />
                    <ShapeMarker count={count} />
                  </span>
                  <span className="w-full truncate text-center text-[10px] leading-none">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 p-1.5 shadow-lg backdrop-blur-md">
        <div
          ref={rackRef}
          onWheel={rack.onWheel}
          onScroll={rack.onScroll}
          role="group"
          aria-label="Shapes"
          style={{
            maxWidth: RACK_MAX_WIDTH,
            maskImage: edgeMask(rack.edges),
            WebkitMaskImage: edgeMask(rack.edges),
          }}
          className="no-scrollbar flex items-center gap-0.5 overflow-x-auto overscroll-x-contain"
        >
          {NODE_SHAPES.map(({ shape, label }) => {
            const count = counts[shape] ?? 0;
            return (
              <button
                key={shape}
                type="button"
                draggable
                onDragStart={(event) => startDrag(event, shape)}
                title={shapeAriaLabel(label, count)}
                aria-label={shapeAriaLabel(label, count)}
                className="flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-accent-dim hover:text-copy-primary active:cursor-grabbing"
              >
                <span className="relative block h-5 w-5">
                  <ShapeOutline
                    shape={shape}
                    color="var(--text-secondary)"
                    bg="transparent"
                  />
                  <ShapeMarker count={count} />
                </span>
              </button>
            );
          })}
        </div>

        <span aria-hidden className="h-6 w-px shrink-0 bg-surface-border" />

        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          aria-controls="shape-library"
          title="Show all shapes"
          aria-label="Show all shapes"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
            expanded
              ? "bg-accent-dim text-brand"
              : "text-copy-muted hover:bg-accent-dim hover:text-copy-primary"
          }`}
        >
          <Shapes className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
