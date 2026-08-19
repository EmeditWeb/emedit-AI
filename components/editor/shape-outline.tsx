"use client";

import type { CanvasNodeShape } from "@/types/canvas";

interface ShapeOutlineProps {
  shape: CanvasNodeShape;
  color: string;
  selected?: boolean;
}

const FILL = "rgba(20, 20, 28, 0.85)";

export function ShapeOutline({ shape, color, selected = false }: ShapeOutlineProps) {
  const strokeWidth = selected ? 3 : 2;
  const strokeOpacity = selected ? 1 : 0.7;

  if (shape === "rectangle") {
    return (
      <div
        className="absolute inset-0 rounded-md"
        style={{
          border: `${strokeWidth}px solid ${color}`,
          background: FILL,
        }}
      />
    );
  }

  if (shape === "circle") {
    return (
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `${strokeWidth}px solid ${color}`,
          background: FILL,
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
          border: `${strokeWidth}px solid ${color}`,
          background: FILL,
        }}
      />
    );
  }

  const solid = {
    fill: FILL,
    stroke: color,
    strokeWidth,
    strokeOpacity,
  } as const;

  const hollow = {
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeOpacity,
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