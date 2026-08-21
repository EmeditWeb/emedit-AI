import Link from "next/link";
import { ArrowRight, LayoutTemplate } from "lucide-react";

import { Reveal } from "@/components/landing/reveal";

export function CtaBand({ signedIn }: { signedIn: boolean }) {
  const startHref = signedIn ? "/editor" : "/sign-in";
  return (
    <section className="px-6 pb-24 md:pb-28">
      <Reveal>
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-brand/25 bg-gradient-to-br from-elevated via-surface to-base px-6 py-16 text-center sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-20 left-1/2 h-64 w-[500px] -translate-x-1/2 rounded-full bg-brand/15 blur-[100px]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-grid opacity-50"
          />

          <div className="relative z-10 flex flex-col items-center gap-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-ai/25 bg-ai/15 px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-ai-text uppercase">
              <LayoutTemplate className="size-3.5" />
              Free to start
            </span>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-copy-primary sm:text-4xl md:text-5xl">
              Turn your next system idea into a{" "}
              <span className="bg-gradient-to-r from-brand to-ai-text bg-clip-text text-transparent">
                shared spec
              </span>
              .
            </h2>
            <p className="max-w-xl text-sm leading-relaxed text-copy-muted sm:text-base">
              Create a workspace, describe your architecture, and watch it come
              to life on the canvas with your team, in real time.
            </p>
            <Link
              href={startHref}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand px-8 text-sm font-semibold text-black shadow-[0_0_0_1px_rgba(0,200,212,0.4),0_10px_36px_-12px_rgba(0,200,212,0.6)] transition-all hover:bg-brand/90 active:scale-[0.98]"
            >
              {signedIn ? "Open the editor" : "Start building"}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}