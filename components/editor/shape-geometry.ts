import type { CanvasNodeShape } from "@/types/canvas";

/**
 * Outline geometry for every shape drawn as an SVG.
 *
 * Paths are authored on a normalised 0–100 box and stretched to the node's
 * box with `preserveAspectRatio="none"`, so a shape keeps filling its node at
 * any size. Coordinates sit inside 2–98 so a 1.5px stroke is never clipped
 * against the edge of the node.
 *
 * `body` is the silhouette — filled and stroked. `detail` is an optional
 * internal line (a cylinder's cap, a note's fold) stroked only, lighter than
 * the body. Keeping the geometry here means the canvas renderer and the
 * template previews cannot drift apart.
 *
 * Every command below takes coordinates as consecutive pairs (`M`, `L`, `Q`,
 * `C`, `Z`) — no arcs — which is the contract [`scalePathData`] relies on.
 */
export interface ShapeGeometry {
  body: string;
  detail?: string;
}

export const SHAPE_GEOMETRY: Partial<Record<CanvasNodeShape, ShapeGeometry>> = {
  triangle: { body: "M 50 2 L 98 98 L 2 98 Z" },
  diamond: { body: "M 50 2 L 98 50 L 50 98 L 2 50 Z" },
  hexagon: { body: "M 25 2 L 75 2 L 98 50 L 75 98 L 25 98 L 2 50 Z" },
  parallelogram: { body: "M 24 2 L 98 2 L 76 98 L 2 98 Z" },
  trapezoid: { body: "M 22 2 L 78 2 L 98 98 L 2 98 Z" },
  step: { body: "M 2 2 L 76 2 L 98 24 L 98 98 L 2 98 Z" },
  cross: {
    body: "M 35 2 L 65 2 L 65 35 L 98 35 L 98 65 L 65 65 L 65 98 L 35 98 L 35 65 L 2 65 L 2 35 L 35 35 Z",
  },
  star: {
    body: "M 50 2 L 61.2 34.6 L 95.6 35.1 L 68.1 55.9 L 78.2 88.8 L 50 69 L 21.8 88.8 L 31.9 55.9 L 4.4 35.1 L 38.8 34.6 Z",
  },
  chevron: { body: "M 2 2 L 60 2 L 98 50 L 60 98 L 2 98 L 40 50 Z" },
  cylinder: {
    body: "M 2 12 Q 2 2 50 2 Q 98 2 98 12 L 98 88 Q 98 98 50 98 Q 2 98 2 88 Z",
    detail: "M 2 12 Q 2 22 50 22 Q 98 22 98 12",
  },
  document: {
    body: "M 2 2 L 98 2 L 98 84 C 72 100 72 68 50 84 C 28 100 28 68 2 84 Z",
  },
  note: {
    body: "M 2 2 L 98 2 L 98 74 L 74 98 L 2 98 Z",
    detail: "M 98 74 L 74 74 L 74 98",
  },
  cloud: {
    body: "M 24 92 C 8 92 4 62 18 54 C 14 28 42 12 50 30 C 62 12 92 18 86 40 C 98 50 98 92 88 92 Z",
  },
  delay: {
    body: "M 2 2 L 50 2 C 78 2 98 24 98 50 C 98 76 78 98 50 98 L 2 98 Z",
  },
  display: { body: "M 14 2 L 92 2 L 78 50 L 92 98 L 14 98 C 2 66 2 34 14 2 Z" },
};

/** The viewBox the geometry above is authored against. */
export const SHAPE_GEOMETRY_VIEWBOX = "0 0 100 100";
export const SHAPE_GEOMETRY_SIZE = 100;

/**
 * Maps a path's coordinates from the 0–100 box onto an arbitrary rect.
 *
 * Only valid for geometry whose commands take coordinates as consecutive
 * pairs — the contract `SHAPE_GEOMETRY` documents. Needed because SVG scales
 * the *stroke* along with the geometry, so anything drawing a shared shape at
 * a size other than its node box has to move the points instead of nesting a
 * `viewBox`.
 */
const COORDINATE = /-?\d*\.?\d+/g;

export function scalePathData(
  d: string,
  {
    x,
    y,
    width,
    height,
  }: { x: number; y: number; width: number; height: number },
): string {
  const sx = width / SHAPE_GEOMETRY_SIZE;
  const sy = height / SHAPE_GEOMETRY_SIZE;
  let index = 0;

  return d.replace(COORDINATE, (match) => {
    const value = Number(match);
    const scaled = index % 2 === 0 ? x + value * sx : y + value * sy;
    index += 1;
    return String(Number(scaled.toFixed(3)));
  });
}
