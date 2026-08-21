"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { SectionHead } from "@/components/landing/section-head";

const FAQS = [
  {
    q: "Do I need to be technical to use Emedit AI?",
    a: "No. Describe your system in plain English and let the AI build the first draft on the canvas. You refine it visually, no diagramming expertise required.",
  },
  {
    q: "Can my team collaborate on the same architecture at once?",
    a: "Yes. The canvas is a shared room powered by Liveblocks, so live cursors, presence avatars, and real-time edits appear for everyone instantly.",
  },
  {
    q: "How does collaborative editing stay consistent?",
    a: "The workspace runs on a conflict-free shared state, so multiple people can move nodes, edit labels, and connect shapes without overwriting each other.",
  },
  {
    q: "What does the spec generator actually produce?",
    a: "A structured Markdown technical specification derived from the final graph, covering components, data flow, and boundaries. It is persisted with the project for review or download.",
  },
  {
    q: "Is there a way to start from something proven?",
    a: "Yes. The starter template library includes ready-made systems like microservices, event-driven architectures, CI/CD pipelines, and payment gateways you can import and adapt.",
  },
  {
    q: "Do signed-in users need to worry about missing delete events?",
    a: "We surface notifications for events like a workspace being deleted, so you are never left wondering why a shared project vanished.",
  },
];

/**
 * Each question renders as its own always-visible header row; the answer
 * expands beneath it on click (the "dropdown"). Questions are NOT wrapped in a
 * scroll-reveal so they are never hidden on initial view.
 */
export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24 px-6 py-20 md:py-24">
      <div className="mx-auto max-w-3xl">
        <SectionHead
          eyebrow="FAQ"
          title={
            <>
              Answers,{" "}
              <span className="text-copy-muted italic">before you ask.</span>
            </>
          }
        />

        <div className="flex flex-col gap-3">
          {FAQS.map(({ q, a }, index) => {
            const isOpen = open === index;
            return (
              <div
                key={q}
                className="overflow-hidden rounded-2xl border border-surface-border bg-elevated/40 transition-colors hover:border-brand/30"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${index}`}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-base font-semibold text-copy-primary">
                    {q}
                  </span>
                  <ChevronDown
                    className={`size-4 shrink-0 text-copy-muted transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <div
                  id={`faq-panel-${index}`}
                  className="grid transition-all duration-300 ease-out"
                  style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-copy-muted">
                      {a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}