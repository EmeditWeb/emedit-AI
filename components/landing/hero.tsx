import Link from "next/link";
import { ArrowDown, ArrowRight, BrainCircuit } from "lucide-react";

import { Reveal } from "@/components/landing/reveal";

const PRIMARY_CTA =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full bg-brand px-7 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(0,200,212,0.4),0_8px_30px_-10px_rgba(0,200,212,0.5)] transition-all hover:bg-brand/90 active:scale-[0.98]";

const SECONDARY_CTA =
  "inline-flex h-11 items-center justify-center gap-2 rounded-full border border-surface-border-subtle bg-surface/60 px-7 text-sm font-semibold text-copy-primary backdrop-blur transition-all hover:border-brand/50 hover:bg-surface active:scale-[0.98]";

export function Hero({ signedIn }: { signedIn: boolean }) {
  const startHref = signedIn ? "/editor" : "/sign-in";
  return (
    <section className="relative overflow-hidden px-6 pt-36 pb-20 sm:pt-44 lg:pb-28">
      {/* ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-brand/10 blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-24 -right-24 h-[420px] w-[420px] rounded-full bg-ai/10 blur-[110px]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_35%,black,transparent)]"
      />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-dim px-4 py-1.5 text-[11px] font-semibold tracking-[0.22em] text-brand uppercase">
            <BrainCircuit className="size-3.5" />
            AI × Real-time Collaboration
          </span>
        </Reveal>

        <Reveal delay={60}>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight text-copy-primary sm:text-5xl md:text-6xl lg:text-7xl">
            Design systems at the
            <span className="block bg-gradient-to-r from-brand via-ai-text to-brand bg-clip-text text-transparent">
              speed of thought.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={120}>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-copy-muted sm:text-lg">
            Describe your architecture in plain English. Emedit AI maps it to a
            shared canvas, your whole team refines it together with live cursors,
            and it becomes a polished technical spec, in minutes not weeks.
          </p>
        </Reveal>

        <Reveal delay={180}>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <Link href={startHref} className={`${PRIMARY_CTA} w-full sm:w-auto`}>
              Start building
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how-it-works"
              className={`${SECONDARY_CTA} w-full sm:w-auto`}
            >
              See how it works
              <ArrowDown className="size-4" />
            </Link>
          </div>
        </Reveal>

        <Reveal delay={240}>
          <p className="mt-10 text-xs text-copy-faint">
            Collaborative architecture · starter templates · spec export
          </p>
        </Reveal>
      </div>
    </section>
  );
}