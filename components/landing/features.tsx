import {
  Bell,
  FileText,
  Frame,
  Grab,
  LayoutTemplate,
  Shapes,
  Sparkles,
  Users,
  Waypoints,
} from "lucide-react";

import { Reveal } from "@/components/landing/reveal";
import { SectionHead } from "@/components/landing/section-head";

const FEATURES = [
  {
    icon: Sparkles,
    accent: "text-brand bg-brand-dim",
    title: "AI architecture generation",
    description:
      "Describe a system and the AI maps your prompt onto the canvas as nodes and edges, structurally sound and ready to edit.",
  },
  {
    icon: Users,
    accent: "text-ai-text bg-ai/15",
    title: "Real-time collaboration",
    description:
      "Live cursors, presence avatars, and shared editing. Every collaborator sees the canvas update the instant it changes.",
  },
  {
    icon: LayoutTemplate,
    accent: "text-brand bg-brand-dim",
    title: "Starter template library",
    description:
      "Import prebuilt system designs (microservices, event-driven, CI/CD, payment gateways) and adapt them in seconds.",
  },
  {
    icon: Shapes,
    accent: "text-ai-text bg-ai/15",
    title: "A rich node system",
    description:
      "Six shapes, eight color themes, and eleven fonts give every node a clear role. Decisions, events, storage, and boundaries at a glance.",
  },
  {
    icon: Waypoints,
    accent: "text-brand bg-brand-dim",
    title: "Edges with context",
    description:
      "Connections arrive from the exact side you used, and every edge carries an inline label so data flow stays self-documenting.",
  },
  {
    icon: Frame,
    accent: "text-ai-text bg-ai/15",
    title: "Undo, redo & design tools",
    description:
      "Full history walks back every collaborative change, with zoom, fit view, and keyboard-shortcut controls built in.",
  },
  {
    icon: Grab,
    accent: "text-brand bg-brand-dim",
    title: "Drag-to-create shapes",
    description:
      "Grab a shape from the palette and drop it anywhere, and it lands centered under your cursor, sized and colored to fit.",
  },
  {
    icon: Bell,
    accent: "text-ai-text bg-ai/15",
    title: "Invites & notifications",
    description:
      "Share a workspace by email, track pending invites, and stay aware the moment a workspace is removed under you.",
  },
  {
    icon: FileText,
    accent: "text-brand bg-brand-dim",
    title: "Instant spec export",
    description:
      "Turn the final graph into a clean Markdown technical specification you can review, share, or download.",
  },
];

export function Features() {
  return (
    <section
      id="features"
      className="relative scroll-mt-24 border-y border-surface-border bg-surface/30 px-6 py-20 md:py-24"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grid opacity-60"
      />
      <div className="relative mx-auto max-w-7xl">
        <SectionHead
          eyebrow="Features"
          title={
            <>
              Everything a system design session needs,
              <span className="text-copy-muted italic"> nothing it doesn&apos;t.</span>
            </>
          }
          description="Purpose-built for turning architecture conversations into something your team can act on."
        />

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, accent, title, description }, index) => (
            <Reveal key={title} delay={(index % 3) * 60}>
              <article className="group flex h-full flex-col rounded-2xl border border-surface-border bg-elevated/40 p-6 transition-all hover:-translate-y-1 hover:border-brand/30 hover:bg-elevated">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}
                  aria-hidden
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-5 text-base font-semibold text-copy-primary">
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