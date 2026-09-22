"use client";

import { useState } from "react";

import { NODE_COLORS, type NodeColorPair } from "@/types/canvas";

interface ColorSwatchesProps {
  activeColor: string;
  onSelect: (pair: NodeColorPair) => void;
}

/** Tight glow tuned to the swatch text color — a ring plus a short bloom. */
const glowShadow = (color: string) =>
  `0 0 0 1px ${color}, 0 0 6px 0 ${color}80`;

const activeShadow = (color: string) =>
  `0 0 0 1.5px ${color}, 0 0 4px 0 ${color}66`;

export function ColorSwatches({ activeColor, onSelect }: ColorSwatchesProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  return (
    <div className="nodrag nopan flex items-center gap-1">
      {NODE_COLORS.map((pair) => {
        const isActive = pair.text === activeColor;
        const isHovered = hoveredKey === pair.key;
        return (
          <button
            key={pair.key}
            type="button"
            aria-label={`${pair.label} color`}
            aria-pressed={isActive}
            title={pair.label}
            onMouseEnter={() => setHoveredKey(pair.key)}
            onMouseLeave={() => setHoveredKey(null)}
            onClick={() => onSelect(pair)}
            className="h-4 w-4 shrink-0 rounded-full transition-transform duration-150"
            style={{
              background: pair.bg,
              border: `1.5px solid ${pair.text}`,
              transform: isActive || isHovered ? "scale(1.15)" : "scale(1)",
              boxShadow: isHovered
                ? glowShadow(pair.text)
                : isActive
                  ? activeShadow(pair.text)
                  : "none",
            }}
          />
        );
      })}
    </div>
  );
}
