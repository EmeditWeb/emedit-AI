# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Foundation — Design System & UI Primitives

## Current Goal

- Move to the next feature unit.

## Completed

- Feature 01: Design System
  - Installed and configured shadcn/ui (Radix Nova, Tailwind v4, CSS variables)
  - Added components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea → `components/ui/`
  - Installed lucide-react for icons
  - Created `lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
  - Updated `app/globals.css` with project dark theme CSS variables (`--bg-base`, `--bg-surface`, etc.) and Tailwind `@theme inline` mappings
  - Hardcoded dark mode: `dark` class on `<html>`, shadcn tokens set to dark values in `:root`
  - Build and TypeScript checks pass cleanly

## In Progress

- None.

## Next Up

- Add the next planned feature unit here.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Dark-only: shadcn CSS variables are set once in `:root` with dark values; no light/dark split. The `dark` class is added to `<html>` as a belt-and-suspenders so shadcn's `.dark` selectors also resolve correctly.
- Tailwind v4 CSS-based config — no `tailwind.config.js`. Project tokens are defined as CSS custom properties in `globals.css` and mapped to Tailwind utilities via `@theme inline`.

## Session Notes

- `components/ui/*` must not be modified after installation per the spec.
- Project-specific token names: `bg-base`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.
