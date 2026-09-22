"use client";

import type { CanvasNodeShape } from "@/types/canvas";

import { SHAPE_GEOMETRY, SHAPE_GEOMETRY_VIEWBOX } from "./shape-geometry";

interface ShapeOutlineProps {
  shape: CanvasNodeShape;
  color: string;
  bg?: string;
  selected?: boolean;
}

const DEFAULT_FILL = "var(--canvas-shape-fill)";

/**
 * Folds an opacity into a color so the CSS-border and SVG branches resolve to
 * the same value. Non-hex colors (design tokens) cannot be parsed and are
 * returned untouched, which is why the SVG branch strokes with the folded
 * color instead of combining `color` with `strokeOpacity`.
 */
const withOpacity = (color: string, opacity: number): string => {
  const hex = color.trim().replace("#", "");
  if (hex.length !== 6 || !/^[0-9a-f]{6}$/i.test(hex)) return color;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

export function ShapeOutline({
  shape,
  color,
  bg,
  selected = false,
}: ShapeOutlineProps) {
  const strokeWidth = selected ? 1.5 : 1;
  const strokeOpacity = selected ? 0.9 : 0.55;
  const fill = bg ?? DEFAULT_FILL;
  const borderColor = withOpacity(color, strokeOpacity);
  const detailColor = withOpacity(color, strokeOpacity * 0.7);

  if (shape === "rectangle") {
    return (
      <div
        className="absolute inset-0 rounded-md"
        style={{
          border: `${strokeWidth}px solid ${borderColor}`,
          background: fill,
        }}
      />
    );
  }

  if (shape === "circle") {
    return (
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `${strokeWidth}px solid ${borderColor}`,
          background: fill,
        }}
      />
    );
  }

  if (shape === "pill") {
    return (
      <div
        className="absolute inset-0"
        style={{
          borderRadius: 9999,
          border: `${strokeWidth}px solid ${borderColor}`,
          background: fill,
        }}
      />
    );
  }

  // Everything else — including `text`, which has no outline — is drawn from
  // the shared path geometry. Text annotations pass `null` so callers can rely
  // on the absence of an outline.
  const geometry = SHAPE_GEOMETRY[shape];
  if (!geometry) return null;

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={SHAPE_GEOMETRY_VIEWBOX}
      preserveAspectRatio="none"
    >
      <path
        d={geometry.body}
        fill={fill}
        stroke={borderColor}
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
      {geometry.detail ? (
        <path
          d={geometry.detail}
          fill="none"
          stroke={detailColor}
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  );
}
