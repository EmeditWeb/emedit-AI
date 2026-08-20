"use client";

import { ArrowDownToLine, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CANVAS_TEMPLATES,
  type CanvasTemplate,
} from "@/components/editor/starter-templates";
import type { CanvasNode } from "@/types/canvas";

interface StarterTemplatesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (template: CanvasTemplate) => void;
}

export function StarterTemplatesModal({
  open,
  onOpenChange,
  onImport,
}: StarterTemplatesModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Flex column + a dvh cap keeps the header fixed and the grid the only
        // scrolling region, so every card's Import button stays reachable no
        // matter how short the viewport is.
        className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-[1400px] flex-col overflow-hidden p-0 sm:w-[calc(100vw-4rem)] sm:max-w-[1400px]"
        showCloseButton={false}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-3 sm:px-8 sm:pt-6">
          <DialogHeader className="gap-1.5">
            {/* NB: `text-base` is a COLOUR utility in this project
                (--color-base), not a font size. Use the numeric scale. */}
            <DialogTitle className="text-lg">Import Template</DialogTitle>
            <DialogDescription className="max-w-lg text-xs leading-relaxed">
              Choose a starter template to add to your canvas. It is placed
              beside your existing work, use ⌘Z to undo.
            </DialogDescription>
          </DialogHeader>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="-mr-2 -mt-1 shrink-0"
              aria-label="Close templates"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </div>

        <div
          // content-start + auto-rows-min are required: the grid has a definite
          // height from flex-1, and the default align-content:stretch would
          // squash every row to fit instead of letting the container scroll.
          className="no-scrollbar grid min-h-0 flex-1 auto-rows-min grid-cols-1 content-start gap-5 overflow-y-auto px-5 pt-2 pb-6 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))] sm:gap-7 sm:px-8 sm:pb-8"
        >
          {CANVAS_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onImport={onImport}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TemplateCard({
  template,
  onImport,
}: {
  template: CanvasTemplate;
  onImport: (template: CanvasTemplate) => void;
}) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-surface-border bg-surface/70 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),0_10px_28px_-16px_rgba(0,0,0,0.8)] transition-colors hover:border-ai/40 hover:bg-surface">
      <div className="w-full border-b border-white/5 bg-[#0a0a12] p-3">
        <TemplatePreview template={template} />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <span className="line-clamp-2 text-sm font-semibold break-words text-copy-primary">
          {template.name}
        </span>
        <span className="line-clamp-3 text-xs leading-relaxed break-words text-copy-muted">
          {template.description}
        </span>
        <div className="mt-auto pt-4">
          <Button
            variant="default"
            size="sm"
            className="w-full"
            onClick={() => onImport(template)}
          >
            <ArrowDownToLine className="h-3.5 w-3.5" />
            Import
          </Button>
        </div>
      </div>
    </div>
  );
}

const PREVIEW_WIDTH = 320;
const PREVIEW_HEIGHT = 200;
const PAD = 14;

function TemplatePreview({ template }: { template: CanvasTemplate }) {
  const { nodes, edges } = template;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of nodes) {
    const w = node.width ?? 100;
    const h = node.height ?? 60;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  const contentW = Math.max(1, maxX - minX);
  const contentH = Math.max(1, maxY - minY);
  const scale = Math.min(
    (PREVIEW_WIDTH - PAD * 2) / contentW,
    (PREVIEW_HEIGHT - PAD * 2) / contentH,
  );
  const offsetX = (PREVIEW_WIDTH - contentW * scale) / 2 - minX * scale;
  const offsetY = (PREVIEW_HEIGHT - contentH * scale) / 2 - minY * scale;

  const sx = (node: CanvasNode, v: number) =>
    offsetX + node.position.x * scale + v * scale;
  const sy = (node: CanvasNode, v: number) =>
    offsetY + node.position.y * scale + v * scale;

  const centerOf = (node: CanvasNode) => ({
    x: sx(node, (node.width ?? 100) / 2),
    y: sy(node, (node.height ?? 60) / 2),
  });

  const sideAnchor = (node: CanvasNode, towardX: number, towardY: number) => {
    if (node.data.shape === "text") return centerOf(node);
    const w = node.width ?? 100;
    const h = node.height ?? 60;
    const cx = sx(node, w / 2);
    const cy = sy(node, h / 2);
    const dx = towardX - cx;
    const dy = towardY - cy;
    if (Math.abs(dx) > Math.abs(dy)) {
      return { x: dx >= 0 ? sx(node, w) : sx(node, 0), y: cy };
    }
    return { x: cx, y: dy >= 0 ? sy(node, h) : sy(node, 0) };
  };

  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  return (
    <svg
      viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`}
      className="aspect-[8/5] w-full"
      role="img"
      aria-label={`${template.name} preview`}
    >
      <defs>
        <pattern
          id={`${template.id}-dots`}
          width={10}
          height={10}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={1} cy={1} r={0.9} fill="rgba(255,255,255,0.09)" />
        </pattern>
      </defs>
      <rect
        width={PREVIEW_WIDTH}
        height={PREVIEW_HEIGHT}
        fill={`url(#${template.id}-dots)`}
      />

      {edges.map((edge) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        if (!source || !target) return null;
        const from = sideAnchor(source, centerOf(target).x, centerOf(target).y);
        const to = sideAnchor(target, centerOf(source).x, centerOf(source).y);
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        return (
          <path
            key={edge.id}
            d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
            fill="none"
            stroke={source.data.color}
            strokeOpacity={0.75}
            strokeWidth={1.8}
          />
        );
      })}

      {nodes.map((node) => {
        const w = node.width ?? 100;
        const h = node.height ?? 60;
        return (
          <ShapeGlyph
            key={node.id}
            node={node}
            x={sx(node, 0)}
            y={sy(node, 0)}
            w={w * scale}
            h={h * scale}
          />
        );
      })}
    </svg>
  );
}

// Rough advance width for the sans stack; good enough to decide when a preview
// label needs clipping.
const AVG_GLYPH_RATIO = 0.55;

function truncateToWidth(
  text: string,
  maxWidth: number,
  fontSize: number,
): string {
  const charWidth = fontSize * AVG_GLYPH_RATIO;
  const maxChars = Math.floor(maxWidth / charWidth);
  if (maxChars >= text.length) return text;
  if (maxChars < 2) return "";
  return `${text.slice(0, maxChars - 1).trimEnd()}\u2026`;
}

function ShapeGlyph({
  node,
  x,
  y,
  w,
  h,
}: {
  node: CanvasNode;
  x: number;
  y: number;
  w: number;
  h: number;
}) {
  const data = node.data;
  const fill = data.bg ?? "#14141c";
  const stroke = data.color;
  const fontSize = Math.max(5, Math.min(11, Math.min(w * 0.22, h * 0.34)));
  const cx = x + w / 2;
  const cy = y + h / 2;

  // Labels are baked into the SVG, so they cannot rely on CSS wrapping. Clip
  // them to the glyph width to keep previews from spilling past their shapes.
  const isText = data.shape === "text";
  const maxLabelWidth = isText ? w : Math.max(0, w - 6);
  const labelText = truncateToWidth(data.label, maxLabelWidth, fontSize);

  const label = labelText ? (
    <text
      x={cx}
      y={cy}
      textAnchor="middle"
      dominantBaseline="central"
      fill={data.color}
      fontSize={fontSize}
      style={{ fontFamily: "var(--font-geist-sans)" }}
    >
      {labelText}
    </text>
  ) : null;

  if (isText) {
    return label;
  }

  if (data.shape === "rectangle" || data.shape === "pill") {
    const rx = data.shape === "pill" ? h / 2 : Math.min(w, h) / 6;
    return (
      <g>
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          rx={rx}
          fill={fill}
          fillOpacity={0.9}
          stroke={stroke}
          strokeWidth={1.5}
        />
        {label}
      </g>
    );
  }

  if (data.shape === "circle") {
    const r = Math.min(w, h) / 2;
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={fill}
          fillOpacity={0.9}
          stroke={stroke}
          strokeWidth={1.5}
        />
        {label}
      </g>
    );
  }

  if (data.shape === "diamond") {
    const points = `${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}`;
    return (
      <g>
        <polygon
          points={points}
          fill={fill}
          fillOpacity={0.9}
          stroke={stroke}
          strokeWidth={1.5}
        />
        {label}
      </g>
    );
  }

  if (data.shape === "hexagon") {
    const inset = w * 0.12;
    const points = `${x + inset},${y} ${x + w - inset},${y} ${x + w},${cy} ${x + w - inset},${y + h} ${x + inset},${y + h} ${x},${cy}`;
    return (
      <g>
        <polygon
          points={points}
          fill={fill}
          fillOpacity={0.9}
          stroke={stroke}
          strokeWidth={1.5}
        />
        {label}
      </g>
    );
  }

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={Math.min(w, h) / 6}
        fill={fill}
        fillOpacity={0.9}
        stroke={stroke}
        strokeWidth={1.5}
      />
      <ellipse
        cx={cx}
        cy={y}
        rx={w / 3}
        ry={Math.min(7, h / 7)}
        fill="none"
        stroke={stroke}
        strokeOpacity={0.6}
        strokeWidth={1.2}
      />
      {label}
    </g>
  );
}