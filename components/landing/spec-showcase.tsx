import { Check, FileText } from "lucide-react";

import { Reveal } from "@/components/landing/reveal";

const PERKS = [
  "Persistent Markdown tied to each project",
  "Structured sections for services, data, and events",
  "Review and download it, or share it outside the app",
  "Rebuild the spec any time the canvas changes",
];

const SPEC_SAMPLE = `# Emedit Checkout System

## Overview
A payments service that verifies charges
cryptographically for your AI agents.

## Components
- **API Gateway**: authenticates & routes traffic
- **Orders Service**: owns the order lifecycle
- **Payments**: settles charges on Stellar
- **Users DB**: authoritative customer records
- **Events**: fan-out of order events

## Data Flow
1. Gateway authenticates the client
2. Orders validates and enqueues an event
3. Payments settles; Users DB updates in sync

## Boundaries
- Checkout sits behind the gateway (north)
- Settlement is isolated to Payments
`;

export function SpecShowcase() {
  return (
    <section className="relative border-y border-surface-border bg-surface/30 px-6 py-20 md:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ai/25 bg-ai/15 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-ai-text uppercase">
              <FileText className="size-3.5" />
              From canvas to spec
            </span>
            <h2 className="max-w-xl text-3xl font-bold tracking-tight text-copy-primary sm:text-4xl md:text-5xl">
              Your design becomes a document,{" "}
              <span className="text-copy-muted italic">automatically.</span>
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-copy-muted sm:text-base">
              Stop rewriting READMEs by hand. Emedit AI reads the final graph
              and produces a clear, structured Markdown spec every stakeholder
              can read, fresh, consistent, and attached to the project.
            </p>
            <ul className="flex flex-col gap-3">
              {PERKS.map((perk) => (
                <li
                  key={perk}
                  className="flex items-center gap-3 text-sm text-copy-secondary"
                >
                  <span
                    className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
                    aria-hidden
                  >
                    <Check className="size-3" />
                  </span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="relative overflow-hidden rounded-2xl border border-surface-border bg-base p-0 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
            <div className="flex items-center gap-2 border-b border-surface-border bg-surface/60 px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-error/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
              <span className="ml-3 font-mono text-xs text-copy-faint">
                spec.md
              </span>
            </div>
            <pre className="no-scrollbar overflow-x-auto p-5 font-mono text-[12px] leading-relaxed text-copy-secondary">
              {SPEC_SAMPLE}
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
}