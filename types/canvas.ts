import type { Edge, Node } from "@xyflow/react";

export type CanvasNodeShape =
  | "rectangle"
  | "pill"
  | "circle"
  | "triangle"
  | "diamond"
  | "hexagon"
  | "parallelogram"
  | "trapezoid"
  | "step"
  | "cross"
  | "star"
  | "chevron"
  | "cylinder"
  | "document"
  | "note"
  | "cloud"
  | "delay"
  | "display"
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
  pill: { width: 160, height: 60 },
  circle: { width: 100, height: 100 },
  triangle: { width: 120, height: 100 },
  diamond: { width: 140, height: 120 },
  hexagon: { width: 140, height: 100 },
  parallelogram: { width: 160, height: 80 },
  trapezoid: { width: 150, height: 80 },
  step: { width: 160, height: 80 },
  cross: { width: 110, height: 110 },
  star: { width: 120, height: 120 },
  chevron: { width: 140, height: 80 },
  cylinder: { width: 120, height: 100 },
  document: { width: 150, height: 100 },
  note: { width: 150, height: 110 },
  cloud: { width: 170, height: 110 },
  delay: { width: 150, height: 80 },
  display: { width: 160, height: 100 },
  text: TEXT_DEFAULT_SIZE,
};

/** A draggable entry in the canvas shape library. */
export interface ShapeDefinition {
  shape: Exclude<CanvasNodeShape, "text">;
  label: string;
}

/**
 * The shape library, in panel order. General-purpose shapes first (mirroring
 * draw.io's basic set), then the diagram-specific ones.
 *
 * `text` is deliberately absent — annotations are created by double-clicking
 * the canvas rather than dragged from the panel.
 */
export const NODE_SHAPES: ShapeDefinition[] = [
  { shape: "rectangle", label: "Rectangle" },
  { shape: "pill", label: "Pill" },
  { shape: "circle", label: "Circle" },
  { shape: "triangle", label: "Triangle" },
  { shape: "diamond", label: "Diamond" },
  { shape: "hexagon", label: "Hexagon" },
  { shape: "parallelogram", label: "Parallelogram" },
  { shape: "trapezoid", label: "Trapezoid" },
  { shape: "step", label: "Step" },
  { shape: "cross", label: "Cross" },
  { shape: "star", label: "Star" },
  { shape: "chevron", label: "Chevron" },
  { shape: "cylinder", label: "Cylinder" },
  { shape: "document", label: "Document" },
  { shape: "note", label: "Note" },
  { shape: "cloud", label: "Cloud" },
  { shape: "delay", label: "Delay" },
  { shape: "display", label: "Display" },
];

export const SHAPE_DRAG_MIME = "application/x-emedit-shape";

export interface ShapeDragPayload {
  shape: CanvasNodeShape;
  width: number;
  height: number;
}
