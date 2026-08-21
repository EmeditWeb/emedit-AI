import { NODE_COLORS, type CanvasNodeShape } from "@/types/canvas";
import { ShapeOutline } from "@/components/editor/shape-outline";
import { Reveal } from "@/components/landing/reveal";
import { SectionHead } from "@/components/landing/section-head";

interface ShowcaseNode {
  label: string;
  shape: CanvasNodeShape;
  colorKey: string;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

interface ShowcaseEdge {
  from: number;
  to: number;
}

const byColor = (key: string) =>
  NODE_COLORS.find((c) => c.key === key) ?? NODE_COLORS[0];

const NODES: ShowcaseNode[] = [
  { label: "API Gateway", shape: "pill", colorKey: "neutral", cx: 50, cy: 16, w: 20, h: 9 },
  { label: "Auth", shape: "rectangle", colorKey: "blue", cx: 17, cy: 42, w: 16, h: 8 },
  { label: "Orders", shape: "rectangle", colorKey: "purple", cx: 50, cy: 42, w: 16, h: 8 },
  { label: "Payments", shape: "hexagon", colorKey: "orange", cx: 83, cy: 42, w: 17, h: 8 },
  { label: "Users DB", shape: "cylinder", colorKey: "green", cx: 17, cy: 66, w: 16, h: 9 },
  { label: "Events", shape: "circle", colorKey: "pink", cx: 50, cy: 68, w: 10, h: 9 },
  { label: "Analytics", shape: "diamond", colorKey: "teal", cx: 83, cy: 68, w: 15, h: 10 },
];

// Merge all shape types into an index so edges can route gateway<->everything.
const EDGES: ShowcaseEdge[] = [
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  { from: 1, to: 4 },
  { from: 1, to: 5 },
  { from: 2, to: 5 },
  { from: 3, to: 6 },
];

/**
 * Where the ray from `(cx, cy)` toward `(tx, ty)` exits the `w x h` box.
 * Returned as `{x, y}` in the same 0-100 percentage coordinate space. Used to
 * anchor edges to the actual node boundary instead of through card centers.
 */
function boundaryPoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  tx: number,
  ty: number,
) {
  const dx = tx - cx;
  const dy = ty - cy;
  const sx = w / 2;
  const sy = h / 2;
  if (sx === 0 || sy === 0) return { x: cx, y: cy };
  const scale = Math.min(Math.abs(sx / dx) || 1, Math.abs(sy / dy) || 1);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

function edgePath(edge: ShowcaseEdge): string {
  const a = NODES[edge.from];
  const b = NODES[edge.to];
  const from = boundaryPoint(a.cx, a.cy, a.w, a.h, b.cx, b.cy);
  const to = boundaryPoint(b.cx, b.cy, b.w, b.h, a.cx, a.cy);
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 - 2;
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

export function CanvasShowcase() {
  return (
    <section
      id="product"
      className="relative scroll-mt-24 px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHead
          eyebrow="The product"
          title={
            <>
              A canvas that feels
              <span className="text-copy-muted italic"> like a whiteboard.</span>
            </>
          }
          description="Real shapes, real colors, real-time presence, rendered from the exact engine that powers the workspace."
        />

        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-surface-border bg-base p-4 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[600px] -translate-x-1/2 rounded-full bg-brand/10 blur-[100px]"
            />
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid" />

            {/* Browser-style chrome */}
            <div className="relative z-10 mb-6 hidden items-center gap-2 border-b border-surface-border pb-3 sm:flex">
              <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-4 rounded-full bg-surface px-4 py-1 text-[11px] text-copy-faint">
                Your architecture, collaborated live
              </span>
            </div>

            <div className="relative z-10 aspect-[16/9] w-full">
              {/* Edges */}
              <svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                viewBox="0 0 100 56.25"
                preserveAspectRatio="none"
                aria-hidden
              >
                {EDGES.map((edge, i) => (
                  <path
                    key={i}
                    d={edgePath(edge)}
                    fill="none"
                    stroke="rgba(240,244,255,0.35)"
                    strokeWidth={0.35}
                  />
                ))}
              </svg>

              {/* Nodes */}
              {NODES.map((node) => {
                const pair = byColor(node.colorKey);
                return (
                  <div
                    key={node.label}
                    className="absolute"
                    style={{
                      left: `${node.cx - node.w / 2}%`,
                      top: `${node.cy - node.h / 2}%`,
                      width: `${node.w}%`,
                      height: `${node.h}%`,
                    }}
                  >
                    <ShapeOutline
                      shape={node.shape}
                      color={pair.text}
                      bg={pair.bg}
                    />
                    <span
                      className="absolute inset-0 flex items-center justify-center px-[8%] text-center text-[min(1.4vw,14px)] font-semibold leading-tight"
                      style={{ color: pair.text }}
                    >
                      {node.label}
                    </span>
                  </div>
                );
              })}

              {/* collaborators */}
              <div className="absolute top-0 right-0 flex items-center gap-2 rounded-full border border-surface-border bg-surface/80 px-2.5 py-1.5 backdrop-blur">
                {["AG", "MK", "JT"].map((initials, i) => (
                  <span
                    key={initials}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-semibold text-black ring-2 ring-base"
                    style={{ backgroundColor: byColor(NODE_COLORS[i].key).text }}
                  >
                    {initials}
                  </span>
                ))}
                <span className="text-[11px] text-copy-muted">3 online</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}