import type { EdgeChange, NodeChange } from "@xyflow/react";

import type { CanvasEdge, CanvasNode } from "@/types/canvas";

import type { CanvasTemplate } from "./starter-templates";

/** Horizontal breathing room between existing content and an import. */
export const IMPORT_GAP = 120;

/**
 * Offset that places a template immediately to the right of everything already
 * on the canvas, vertically aligned with the existing content's top edge.
 * Returns a zero offset for an empty canvas so the first import lands as authored.
 */
export function importOffsetFor(
  existing: ReadonlyArray<CanvasNode>,
  template: CanvasTemplate,
): { x: number; y: number } {
  if (existing.length === 0) return { x: 0, y: 0 };

  let existingRight = -Infinity;
  let existingTop = Infinity;
  for (const node of existing) {
    existingRight = Math.max(
      existingRight,
      node.position.x + (node.width ?? node.measured?.width ?? 0),
    );
    existingTop = Math.min(existingTop, node.position.y);
  }
  if (!Number.isFinite(existingRight) || !Number.isFinite(existingTop)) {
    return { x: 0, y: 0 };
  }

  let templateLeft = Infinity;
  let templateTop = Infinity;
  for (const node of template.nodes) {
    templateLeft = Math.min(templateLeft, node.position.x);
    templateTop = Math.min(templateTop, node.position.y);
  }
  if (!Number.isFinite(templateLeft) || !Number.isFinite(templateTop)) {
    return { x: 0, y: 0 };
  }

  return {
    x: existingRight + IMPORT_GAP - templateLeft,
    y: existingTop - templateTop,
  };
}

export interface TemplateImportChanges {
  nodeChanges: NodeChange<CanvasNode>[];
  edgeChanges: EdgeChange<CanvasEdge>[];
}

/**
 * Build the change-set that adds `template` to an existing canvas.
 *
 * Two invariants matter here:
 * - The import is additive; nothing existing is deleted or moved.
 * - The resulting selection is empty. React Flow drags every selected node as
 *   one unit, so leaving a stale selection (or pre-selecting the import) makes
 *   the imported template and untouched pre-existing nodes move together.
 */
export function buildTemplateImportChanges({
  nodes,
  edges,
  template,
  stamp,
}: {
  nodes: ReadonlyArray<CanvasNode>;
  edges: ReadonlyArray<CanvasEdge>;
  template: CanvasTemplate;
  stamp: string;
}): TemplateImportChanges {
  const idFor = new Map<string, string>();
  template.nodes.forEach((node) =>
    idFor.set(node.id, `${template.id}-${stamp}-${node.id}`),
  );

  const offset = importOffsetFor(nodes, template);

  const deselectNodes: NodeChange<CanvasNode>[] = nodes
    .filter((node) => node.selected)
    .map((node) => ({ type: "select", id: node.id, selected: false }));
  const deselectEdges: EdgeChange<CanvasEdge>[] = edges
    .filter((edge) => edge.selected)
    .map((edge) => ({ type: "select", id: edge.id, selected: false }));

  const additions: NodeChange<CanvasNode>[] = template.nodes.map((node) => ({
    type: "add",
    item: {
      ...node,
      id: idFor.get(node.id) ?? node.id,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      // Imported nodes land unselected so each one drags independently.
      selected: false,
    },
  }));

  const edgeAdditions: EdgeChange<CanvasEdge>[] = template.edges.map(
    (edge) => ({
      type: "add",
      item: {
        ...edge,
        id: `${template.id}-${stamp}-${edge.id}`,
        source: idFor.get(edge.source) ?? edge.source,
        target: idFor.get(edge.target) ?? edge.target,
        selected: false,
      },
    }),
  );

  return {
    nodeChanges: [...deselectNodes, ...additions],
    edgeChanges: [...deselectEdges, ...edgeAdditions],
  };
}
