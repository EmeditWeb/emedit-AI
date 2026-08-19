"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { CANVAS_FONTS, DEFAULT_FONT_KEY } from "./canvas-fonts";

interface FontSelectProps {
  value: string;
  onChange: (font: string) => void;
}

/**
 * Compact pill-shaped font picker. Uses a custom listbox instead of a native
 * `<select>` so the menu renders as a vertical list styled with the canvas
 * theme (native option lists cannot carry per-option fonts consistently).
 */
export function FontSelect({ value, onChange }: FontSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const activeKey = value || DEFAULT_FONT_KEY;
  const active =
    CANVAS_FONTS.find((option) => option.key === activeKey) ?? CANVAS_FONTS[0];

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="nodrag nopan relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        title="Node font"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-6 w-[104px] items-center justify-between gap-1 rounded-full border px-2.5 text-[11px] leading-none transition-colors ${
          open
            ? "border-brand bg-elevated text-copy-primary"
            : "border-surface-border bg-base text-copy-secondary hover:border-surface-border-subtle hover:text-copy-primary"
        }`}
      >
        <span className="truncate" style={{ fontFamily: active.cssVar }}>
          {active.label}
        </span>
        <ChevronDown
          className={`h-3 w-3 shrink-0 text-copy-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label="Node font"
          className="no-scrollbar nowheel absolute left-0 top-[calc(100%+6px)] z-50 max-h-56 w-[150px] overflow-y-auto rounded-2xl border border-surface-border bg-surface/95 p-1 shadow-xl backdrop-blur-md"
        >
          {CANVAS_FONTS.map((option) => {
            const isActive = option.key === activeKey;
            return (
              <button
                key={option.key}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(option.key);
                  setOpen(false);
                }}
                className={`block w-full truncate rounded-full px-3 py-1.5 text-left text-xs transition-colors ${
                  isActive
                    ? "bg-brand/15 text-brand"
                    : "text-copy-secondary hover:bg-elevated hover:text-copy-primary"
                }`}
                style={{ fontFamily: option.cssVar }}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
