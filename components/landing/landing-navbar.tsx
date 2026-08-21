"use client";

import Link from "next/link";
import { ArrowRight, Menu, Moon, Sun, X } from "lucide-react";
import { useState } from "react";

import { useTheme } from "@/components/theme";

const CTA_CLASS =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-brand px-5 text-sm font-semibold text-black transition-all hover:bg-brand/90 active:scale-[0.98]";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "Product", href: "#product" },
  { label: "FAQ", href: "#faq" },
];

export function LandingNavbar({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const ctaHref = signedIn ? "/editor" : "/sign-in";
  const ctaLabel = signedIn ? "Open Editor" : "Sign in";
  const isLight = theme === "light";

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-surface-border bg-base/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-copy-primary"
          >
            <span
              className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-accent-dim text-brand"
              aria-hidden
            >
              <span className="text-sm font-semibold">E</span>
            </span>
            Emedit
            <span className="text-brand">AI</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[13px] font-medium text-copy-muted transition-colors hover:text-copy-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isLight ? "Switch to dark theme" : "Switch to light theme"
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-surface-border bg-surface text-copy-muted transition-colors hover:border-brand/50 hover:text-copy-primary active:scale-[0.97]"
            >
              {isLight ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </button>
            <Link href={ctaHref} className={CTA_CLASS}>
              {ctaLabel}
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                isLight ? "Switch to dark theme" : "Switch to light theme"
              }
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface text-copy-muted transition-colors hover:border-brand/50 hover:text-copy-primary"
            >
              {isLight ? (
                <Moon className="size-4" />
              ) : (
                <Sun className="size-4" />
              )}
            </button>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-surface-border bg-surface text-copy-primary"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>
      </div>

      {open ? (
        <div className="border-b border-surface-border bg-base/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-copy-primary transition-colors hover:bg-surface"
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-surface-border pt-4">
              <Link
                href={ctaHref}
                onClick={() => setOpen(false)}
                className={`${CTA_CLASS} w-full`}
              >
                {ctaLabel}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}