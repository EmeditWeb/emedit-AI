import type { Edge, Node } from "@xyflow/react";

export type CanvasNodeShape = "rectangle" | "rounded" | "ellipse" | "diamond";

export interface CanvasNodeData extends Record<string, unknown> {
  label: string;
  color: string;
  shape: CanvasNodeShape;
}

export type CanvasNode = Node<CanvasNodeData, "canvasNode">;

export type CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">;
