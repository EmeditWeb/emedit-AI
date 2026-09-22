import {
  FileText,
  MessageSquareText,
  Network,
  Users,
} from "lucide-react";

import { Reveal } from "@/components/landing/reveal";
import { SectionHead } from "@/components/landing/section-head";

const STEPS = [
  {
    icon: MessageSquareText,
    title: "Describe",
    description:
      "Type your architecture in plain English. Emedit AI understands the system you have in mind, no drawing required to begin.",
  },
  {
    icon: Network,
    title: "AI generates",
    description:
      "The AI lays out nodes and edges on a shared canvas (services, gateways, events, databases), ready for you to refine.",
  },
  {
    icon: Users,
    title: "Refine together",
    description:
      "Collaborators watch live cursors and edit the diagram in real time. Everything stays in sync, all at once.",
  },
  {
    icon: FileText,
    title: "Ship the spec",
    description:
      "Convert the final graph into a persistent Markdown technical specification your team can review and download.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative scroll-mt-24 px-6 py-20 md:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHead
          eyebrow="How it works"
          title={
            <>
              From an idea to a specification,
              <span className="text-copy-muted italic"> in four moves.</span>
            </>
          }
          description="A workflow designed to remove the friction between thinking and documenting your system."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 60}>
              <article className="group relative flex h-full flex-col rounded-2xl border border-surface-border bg-elevated/60 p-6 transition-all hover:border-brand/30 hover:bg-elevated hover:shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]">
                <span
                  aria-hidden
                  className="absolute top-5 right-5 text-4xl font-black tabular-nums text-copy-faint/30 transition-colors group-hover:text-brand/30"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-dim text-brand"
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-copy-primary">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-copy-muted">
                  {description}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}