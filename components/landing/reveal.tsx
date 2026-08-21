"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger delay in ms. Keep between 0 and ~200 so reveals stay snappy. */
  delay?: number;
}

/**
 * Scroll-reveal wrapper. Fades + lifts its content into view once it enters
 * the viewport (IntersectionObserver, single-shot). Motion is a simple CSS
 * opacity/transform transition that is disabled entirely under
 * `prefers-reduced-motion` via the `.landing-reveal` rule in globals.css.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          // Runs in the observer callback (not synchronously in the effect),
          // so it stays inside the async path the lint rule permits.
          setVisible(true);
          observer.disconnect();
        }
      },
      // Only unveil once the element is mostly past the fold viewport.
      { threshold: 0.15, rootMargin: "0px 0px -48px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`landing-reveal transition-all duration-700 ease-out will-change-transform ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      } ${className ?? ""}`}
      style={{ transitionDelay: visible ? `${delay}ms` : undefined }}
    >
      {children}
    </div>
  );
}