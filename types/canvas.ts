import type { Edge, Node } from "@xyflow/react";

export type CanvasNodeShape =
  | "rectangle"
  | "diamond"
  | "circle"
  | "pill"
  | "cylinder"
  | "hexagon"
  | "text";

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  shape: CanvasNodeShape;
  font: string;
  fontSize?: number;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">;

export const DEFAULT_NODE_COLOR = "#a78bfa";

export const TEXT_NODE_COLOR = "#f0f0f4";

export const TEXT_DEFAULT_SIZE = { width: 240, height: 96 };

export const SHAPE_DEFAULT_SIZES: Record<
  CanvasNodeShape,
  { width: number; height: number }
> = {
  rectangle: { width: 160, height: 80 },
  diamond: { width: 140, height: 120 },
  circle: { width: 100, height: 100 },
  pill: { width: 160, height: 60 },
  cylinder: { width: 120, height: 100 },
  hexagon: { width: 140, height: 100 },
  text: TEXT_DEFAULT_SIZE,
};

export const SHAPE_DRAG_MIME = "application/x-emedit-shape";

export interface ShapeDragPayload {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}
