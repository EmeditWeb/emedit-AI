import type { ReactNode } from "react";
import { Sparkles, Share2, FileText } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

interface Feature {
  icon: typeof Sparkles;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Sparkles,
    title: "AI Architecture Generation",
    description:
      "Describe your system, AI maps it to nodes and edges on a live canvas.",
  },
  {
    icon: Share2,
    title: "Real-time Collaboration",
    description:
      "Live cursors, presence indicators, and shared node editing across your team.",
  },
  {
    icon: FileText,
    title: "Instant Spec Generation",
    description:
      "Export a complete Markdown technical spec directly from the canvas graph.",
  },
];

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="font-sans flex min-h-screen flex-1 bg-base text-copy-primary">
      <aside className="hidden w-1/2 flex-col justify-between bg-surface px-16 py-12 lg:flex">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent-dim text-brand"
            aria-hidden
          >
            <span className="text-sm font-semibold">E</span>
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Emedit AI
          </span>
        </div>

        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-copy-primary">
              Design systems at the
              <br />
              speed of thought.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-copy-muted">
              Describe your architecture in plain English. Emedit AI maps it to
              a shared canvas your whole team can refine in real time.
            </p>
          </div>

          <ul className="flex flex-col gap-6">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span
                  className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-dim text-brand"
                  aria-hidden
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium text-copy-primary">
                    {title}
                  </span>
                  <span className="max-w-sm text-xs leading-relaxed text-copy-muted">
                    {description}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-copy-faint">
          &copy; {new Date().getFullYear()} Emedit AI. All rights reserved.
        </p>
      </aside>

      <main className="flex w-full flex-1 items-center justify-center bg-base px-6 py-12 lg:w-1/2">
        {children}
      </main>
    </div>
  );
}
