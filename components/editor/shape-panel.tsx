"use client";

import type { DragEvent } from "react";
import {
  Circle,
  Diamond,
  Hexagon,
  Cylinder,
  Pill,
  Square,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  SHAPE_DEFAULT_SIZES,
  type CanvasNodeShape,
  type ShapeDragPayload,
} from "@/types/canvas";

interface ShapeButton {
  shape: CanvasNodeShape;
  label: string;
  Icon: LucideIcon;
}

const SHAPE_BUTTONS: ShapeButton[] = [
  { shape: "rectangle", label: "Rectangle", Icon: Square },
  { shape: "diamond", label: "Diamond", Icon: Diamond },
  { shape: "circle", label: "Circle", Icon: Circle },
  { shape: "pill", label: "Pill", Icon: Pill },
  { shape: "cylinder", label: "Cylinder", Icon: Cylinder },
  { shape: "hexagon", label: "Hexagon", Icon: Hexagon },
];

interface ShapePanelProps {
  onDragStart: (
    event: DragEvent<HTMLButtonElement>,
    payload: ShapeDragPayload,
  ) => void;
}

export function ShapePanel({ onDragStart }: ShapePanelProps) {
  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-surface-border bg-surface/90 px-2 py-1.5 shadow-lg backdrop-blur-md">
        {SHAPE_BUTTONS.map(({ shape, label, Icon }) => (
          <button
            key={shape}
            type="button"
            draggable
            onDragStart={(event) =>
              onDragStart(event, {
                shape,
                ...SHAPE_DEFAULT_SIZES[shape],
              })
            }
            title={label}
            aria-label={`Drag ${label}`}
            className="flex h-9 w-9 cursor-grab items-center justify-center rounded-full text-copy-muted transition-colors hover:bg-accent-dim hover:text-copy-primary active:cursor-grabbing"
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

