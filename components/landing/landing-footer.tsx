import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-surface-border bg-base px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-copy-primary">
          <span
            className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent-dim text-brand"
            aria-hidden
          >
            <span className="text-sm font-semibold">E</span>
          </span>
          Emedit
          <span className="text-brand">AI</span>
          <span className="mb-px text-copy-faint">
            · Design systems at the speed of thought.
          </span>
        </div>

        <nav className="flex items-center gap-6">
          <Link
            href="#how-it-works"
            className="text-xs font-medium text-copy-muted transition-colors hover:text-copy-primary"
          >
            How it works
          </Link>
          <Link
            href="#features"
            className="text-xs font-medium text-copy-muted transition-colors hover:text-copy-primary"
          >
            Features
          </Link>
          <Link
            href="#faq"
            className="text-xs font-medium text-copy-muted transition-colors hover:text-copy-primary"
          >
            FAQ
          </Link>
        </nav>

        <p className="text-xs text-copy-faint">
          &copy; {new Date().getFullYear()} Emedit AI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}