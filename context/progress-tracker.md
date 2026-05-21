# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 1: Foundation — Design System & UI Primitives

## Current Goal

- Feature 03: Auth — wire Clerk into the app (provider, proxy, auth pages, redirects, user menu).

## Completed

- Feature 03: Auth (Clerk)
  - Installed `@clerk/ui` for the `dark` theme preset
  - Wrapped root layout in `ClerkProvider` with `dark` theme and `appearance.variables` mapped to project CSS custom properties (`--bg-base`, `--bg-surface`, `--accent-primary`, etc.) — no hardcoded colors
  - Created `proxy.ts` at the project root using `clerkMiddleware` + `createRouteMatcher`; protects every route by default and reads public sign-in/sign-up paths from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` / `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
  - Added catch-all auth pages: `app/(auth)/sign-in/[[...sign-in]]/page.tsx` and `app/(auth)/sign-up/[[...sign-up]]/page.tsx` using Clerk's `<SignIn />` / `<SignUp />` components with default flows
  - Added shared `app/(auth)/layout.tsx` two-panel shell: left = compact `G` logo, tagline, text-only feature list; right = centered Clerk form. Collapses to form-only below `lg`. No gradients, hero, feature cards, or scrollable content
  - `/` now `auth()`s and redirects: signed-in → `/editor`, signed-out → `/sign-in`
  - Editor navbar right section now renders Clerk's `<UserButton />` for profile + logout
  - Added Clerk sign-in/up URL env vars to `.env.local`; existing `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` untouched
  - `npm run build` passes (TypeScript clean)
- Feature 02: Editor Chrome
  - Added `components/editor/editor-navbar.tsx`: fixed-height navbar with left/center/right sections, sidebar toggle using `PanelLeftOpen`/`PanelLeftClose`, dark background with subtle bottom border
  - Added `components/editor/project-sidebar.tsx`: floating overlay sidebar (does not push content), slides in from the left, header with title + close button, `My Projects` / `Shared` tabs with empty placeholder states, full-width `New Project` button with `Plus` icon
  - Dialog pattern is available via shadcn `Dialog` primitives (title, description, footer) — no concrete dialogs built yet
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
