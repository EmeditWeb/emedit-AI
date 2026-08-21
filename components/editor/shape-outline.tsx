"use client";

import type { CanvasNodeShape } from "@/types/canvas";

interface ShapeOutlineProps {
  shape: CanvasNodeShape;
  color: string;
  bg?: string;
  selected?: boolean;
}

const DEFAULT_FILL = "var(--canvas-shape-fill)";

/** CSS-border shapes cannot use `strokeOpacity`, so fold it into the color. */
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

  const solid = {
    fill,
    stroke: color,
    strokeWidth,
    strokeOpacity,
  } as const;

  const hollow = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeOpacity: strokeOpacity * 0.7,
  } as const;

  if (shape === "diamond") {
    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="50,2 98,50 50,98 2,50"
          vectorEffect="non-scaling-stroke"
          {...solid}
        />
      </svg>
    );
  }

  if (shape === "hexagon") {
    return (
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <polygon
          points="25,2 75,2 98,50 75,98 25,98 2,50"
          vectorEffect="non-scaling-stroke"
          {...solid}
        />
      </svg>
    );
  }

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      <path
        d="M 2,12 Q 2,2 50,2 Q 98,2 98,12 L 98,88 Q 98,98 50,98 Q 2,98 2,88 Z"
        vectorEffect="non-scaling-stroke"
        {...solid}
      />
      <path
        d="M 2,12 Q 2,22 50,22 Q 98,22 98,12"
        vectorEffect="non-scaling-stroke"
        {...hollow}
      />
    </svg>
  );
}