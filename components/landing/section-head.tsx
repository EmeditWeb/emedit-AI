import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { Reveal } from "@/components/landing/reveal";

interface SectionHeadProps {
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  align?: "center" | "left";
}

/**
 * Landing-page section header: uppercase tracking-wide eyebrow chip, a bold
 * display title (with a muted italic tail for contrast), and an optional
 * intro paragraph. Mirrors the reference site's typographic hierarchy.
 */
export function SectionHead({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadProps) {
  return (
    <Reveal
      className={cn(
        "mb-12 flex flex-col gap-4",
        align === "center" ? "items-center text-center" : "items-start",
      )}
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-dim px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-brand uppercase">
        {eyebrow}
      </span>
      <h2
        className={cn(
          "max-w-3xl text-3xl font-bold tracking-tight text-copy-primary sm:text-4xl md:text-5xl",
          align === "center" ? "mx-auto" : "",
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "max-w-2xl text-sm leading-relaxed text-copy-muted sm:text-base",
            align === "center" ? "mx-auto" : "",
          )}
        >
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}