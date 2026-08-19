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
  /** Accent color — shape outline and label text. */
  color: string;
  /** Node fill behind the shape outline. */
  bg?: string;
  shape: CanvasNodeShape;
  font: string;
  fontSize?: number;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

export interface CanvasEdgeData extends Record<string, unknown> {
  label?: string;
}

export type CanvasEdge = Edge<CanvasEdgeData, "canvasEdge">;

/** Predefined node color themes — a dark fill paired with a vivid readable text color. */
export interface NodeColorPair {
  key: string;
  label: string;
  bg: string;
  text: string;
}

export const NODE_COLORS: NodeColorPair[] = [
  { key: "neutral", label: "Neutral", bg: "#000000", text: "#FFFFFF" },
  { key: "blue", label: "Blue", bg: "#10233D", text: "#52A8FF" },
  { key: "purple", label: "Purple", bg: "#2E1938", text: "#BF7AF0" },
  { key: "orange", label: "Orange", bg: "#331B00", text: "#FF990A" },
  { key: "red", label: "Red", bg: "#3C1618", text: "#FF6166" },
  { key: "pink", label: "Pink", bg: "#3A1726", text: "#F75F8F" },
  { key: "green", label: "Green", bg: "#0F2E18", text: "#62C073" },
  { key: "teal", label: "Teal", bg: "#062822", text: "#0AC7B4" },
];

export const DEFAULT_NODE_COLOR_PAIR = NODE_COLORS[0];

export const DEFAULT_NODE_COLOR = DEFAULT_NODE_COLOR_PAIR.text;

export const DEFAULT_NODE_BG = DEFAULT_NODE_COLOR_PAIR.bg;

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
