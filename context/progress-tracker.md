# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 5: Realtime — Liveblocks wired into the workspace via a collaborative React Flow canvas.

## Current Goal

- Feature 11: Canvas — Liveblocks-backed React Flow canvas as the workspace surface.

## Completed

- Feature 11: Canvas
  - `types/canvas.ts`: `CanvasNodeShape` union (`rectangle | rounded | ellipse | diamond`), `CanvasNodeData { label; color; shape }` (extends `Record<string, unknown>` so it satisfies React Flow's node-data constraint), and the custom typed aliases `CanvasNode = Node<CanvasNodeData, "canvasNode">` / `CanvasEdge = Edge<Record<string, unknown>, "canvasEdge">`
  - `components/editor/canvas.tsx`: client component. `LiveblocksProvider authEndpoint="/api/liveblocks-auth"` → `RoomProvider id={roomId} initialPresence={{ cursor: null, isThinking: false }}` (includes `isThinking` to satisfy the typed `Presence` from [[liveblocks-config]]) → `ClientSideSuspense` with a spinner fallback → `<CanvasFlow />`. Imports come from `@liveblocks/react/suspense`. Wraps the whole tree in a class-based `CanvasErrorBoundary` that surfaces connection errors via a small `AlertTriangle` panel
  - `CanvasFlow` calls `useLiveblocksFlow<CanvasNode, CanvasEdge>({ suspense: true, nodes: { initial: [] }, edges: { initial: [] } })` and passes the synced `nodes`, `edges`, `onNodesChange`, `onEdgesChange`, `onConnect`, `onDelete` into `<ReactFlow>`. `connectionRadius={40}` for loose connection behavior, `fitView`, `colorMode="dark"`. Children: dot-pattern `<Background variant={Dots} gap={20} size={1.5} color="rgba(255,255,255,0.12)" />` and `<MiniMap pannable zoomable />`. No `<Controls>`, no custom node/edge renderers, no persistence, no AI — per scope limits
  - Stylesheet imports: `@xyflow/react/dist/style.css`, `@liveblocks/react-ui/styles.css`, `@liveblocks/react-flow/styles.css`
  - `components/editor/workspace-shell.tsx`: replaced the `CanvasBackdrop` placeholder (and its `Compass` hero copy) with `<Canvas roomId={project.id} />`. Project ID doubles as the Liveblocks room ID (alignment established in Feature 07). `AiSidebar` placeholder remains untouched
  - `npm run build` passes (TypeScript clean)
- Feature 10: Liveblocks
  - `liveblocks.config.ts`: typed `Presence` (`cursor: { x, y } | null`, `isThinking: boolean`) and `UserMeta` (`id`, `info: { name, avatar?, color }`). Other globals (`Storage`, `RoomEvent`, `ThreadMetadata`, `RoomInfo`) declared as `Record<string, never>` to satisfy `@typescript-eslint/no-empty-object-type`
  - `lib/liveblocks.ts`: `getLiveblocksClient()` returns a `globalThis`-cached `Liveblocks` node client (lazy init so build-time `collect page data` doesn't trip on missing `LIVEBLOCKS_SECRET_KEY`). `getCursorColorForUser(userId)` hashes the user ID and indexes into a fixed 12-color palette for deterministic per-user cursor color
  - `app/api/liveblocks-auth/route.ts`: `POST` requires Clerk `auth()` (401 if absent), reads `room` from request body, calls `getProjectForAccess(roomId)` — returns 401 unauthenticated / 403 denied. On `ok`, ensures the Liveblocks room exists via `getRoom` + `createRoom({ defaultAccesses: [] })` (private by default); patches `usersAccesses[userId] = ["room:write"]` on the existing/created room so the caller can join. Issues an ID token via `liveblocks.identifyUser({ userId, groupIds: [] }, { userInfo: { name, avatar?, color } })`; `name` falls back to email then `"Anonymous"`, `avatar` is only set when Clerk returns one, `color` comes from `getCursorColorForUser(userId)`
  - Added `@liveblocks/node` ^3.19.3 to dependencies
  - `npm run build` passes (TypeScript clean)
- Feature 09: Share Dialog
  - `prisma/models/project.prisma`: added `CollaboratorStatus { PENDING, ACTIVE }` enum and `canShare Boolean @default(false)` field on `ProjectCollaborator`; `status` defaults to `ACTIVE` so legacy rows remain accessible. New composite index `[email, status]` for invitation lookups. Migration `20260529142232_add_collaborator_status_can_share` applied
  - `lib/collaborators.ts`: `enrichCollaborators(emails)` via `clerkClient().users.getUserList({ emailAddress })`; new `getUserProfileById(userId)` for owner / inviter lookups. Both fall back to email-only / null on Clerk failure. No local user table
  - `lib/project-access.ts`: `getProjectForAccess` now filters `collaborators` by `status: "ACTIVE"` — pending invitees cannot open the workspace until they accept
  - `lib/projects-data.ts`: `getProjectsForCurrentUser()` returns `{ owned, shared, invitations }`. `shared` filters by `status: "ACTIVE"`. `invitations` queries `ProjectCollaborator` rows where `email in user.emails AND status = PENDING`, enriching with inviter profile via `getUserProfileById(project.ownerId)`
  - `app/editor/layout.tsx` + `components/editor/editor-chrome.tsx` + `project-actions-context.tsx`: thread `invitations` through the layout → chrome → context
  - `app/api/projects/[projectId]/collaborators/route.ts`: `resolvePermissions()` returns `{ isOwner, callerCollaborator }`. `GET` (owner OR active collaborator) returns `{ owner, collaborators, ownedByCurrentUser, canShare }` where each collaborator includes `id/status/canShare/displayName/avatarUrl`. `POST` allows owner OR active collaborator with `canShare=true`; sets `status="PENDING"` + `canShare=false`; rejects self-invites. `DELETE` uses the same permission gate. Pending records take part in the unique `[projectId,email]` constraint, returning 409 on duplicate invites
  - `app/api/projects/[projectId]/collaborators/[collaboratorId]/route.ts`: `PATCH` (owner-only) toggles `canShare`
  - `app/api/invitations/[invitationId]/route.ts`: `POST { action: "accept" | "reject" }` — recipient verified by email match. Accept → `status="ACTIVE"`; Reject → deletes the row. 409 if already resolved
  - `components/editor/project-sidebar.tsx`: third tab `Invites` (auto-selected when invitations exist) with badge counter. `InvitationRow` shows project name + inviter display name; `Accept` posts `{action:"accept"}` and `router.refresh()` (the project then jumps into `Shared`); `Decline` posts `{action:"reject"}`
  - `components/editor/share-dialog.tsx`: bug fix — re-added `useEffect(() => loadCollaborators(), [open])` because Radix doesn't invoke `onOpenChange(true)` for controlled opens, so the prior reset-only handler never triggered the fetch. Now also surfaces `PENDING` and `CAN SHARE` badges, `ShieldCheck` toggle (owner-only) to grant/revoke share permission per collaborator, and exposes the invite form to active collaborators whose `canShare=true`
  - `npm run build` passes (TypeScript clean) after `npx prisma generate`
- Feature 08: Editor Workspace
  - `lib/project-access.ts`: `getCurrentIdentity()` returns `{ userId, emails }` from Clerk `auth()` + `currentUser()`; `getProjectForAccess(projectId)` resolves to `{ kind: "unauthenticated" | "denied" | "ok", project? }` after checking owner OR collaborator email match
  - `components/editor/access-denied.tsx`: centered layout, `Lock` icon, short message, link back to `/editor`
  - `components/editor/workspace-context.tsx`: client context holding `activeProject` + `isAiSidebarOpen` + `toggleAiSidebar` so the navbar, sidebar, and workspace shell stay in sync without prop drilling
  - `components/editor/workspace-shell.tsx`: client component used by `/editor/[roomId]`. Calls `useEffect` to register the active project on mount (and clear on unmount). Renders the central canvas placeholder (dark background, centered message) and the right-side AI sidebar placeholder (slide-over panel, hidden by default)
  - `components/editor/editor-navbar.tsx`: when active project present, shows project name in the center, `Share` + AI sidebar toggle buttons on the right. When no active project, navbar shows only the sidebar toggle and `UserButton`
  - `components/editor/editor-chrome.tsx`: wraps children with `WorkspaceProvider` alongside the existing `ProjectActionsProvider`
  - `components/editor/project-sidebar.tsx`: rows highlight when `project.id === activeProject.id` (background + accent text)
  - `hooks/use-project-actions.ts`: route param renamed from `projectId` to `roomId` to match the new `[roomId]` segment
  - `app/editor/[roomId]/page.tsx`: server component. Awaits `params`, calls `getProjectForAccess`. Redirects to `/sign-in` on `unauthenticated`, renders `<AccessDenied />` on `denied`, otherwise renders `<WorkspaceShell project={...} />`
  - Scope held: no Liveblocks, no real canvas, no AI chat, no sharing behavior — placeholders only
  - `npm run build` passes (TypeScript clean)
- Feature 07: Wire Editor
  - `lib/projects-data.ts`: `getProjectsForCurrentUser()` reads `auth()` + `currentUser()`, fetches owned projects (`ownerId = userId`) and shared projects (`collaborators.some.email in user emails`, `ownerId != userId`) in parallel, returns `{ owned, shared }` as `ProjectSummary[]` with slug derived from name
  - `app/editor/layout.tsx`: now an async server component — calls the data helper and passes `owned` / `shared` to `EditorChrome`. No client-side fetching on initial load
  - `hooks/use-project-actions.ts`: single hook replacing `use-projects` + `use-project-dialogs`. Manages dialog mode, active project, name input, loading state, and a stable 6-char suffix used to derive the room ID (`slug(name) + "-" + suffix`). `submit` branches on mode: `POST /api/projects` with `{ id: roomId, name }` then `router.push("/editor/<id>")`; `PATCH /api/projects/[id]` then `router.refresh()`; `DELETE /api/projects/[id]` then `router.push("/editor")` if deleting the active workspace (read via `useParams().projectId`), otherwise `router.refresh()`
  - `app/api/projects/route.ts`: `POST` now accepts optional `id` (validated against `/^[a-z0-9][a-z0-9-]{2,63}$/`, 400 on invalid) so the client-generated room ID is stored as `Project.id` — project ID and Liveblocks room ID stay aligned
  - `components/editor/project-dialogs.tsx`: Create dialog shows `Room ID` preview (slug + suffix, suffix stable across keystrokes); Rename pre-fills current name; Delete shows project name. Create button no longer requires non-empty name — server defaults blank to `Untitled Project`
  - `components/editor/editor-chrome.tsx`: accepts `owned` / `shared` props, calls `useProjectActions()` once, exposes `openCreate/openRename/openDelete` via the existing `ProjectActionsProvider`
  - `lib/projects.ts`: `MockProject` renamed to `ProjectSummary`; mock seed arrays removed
  - Removed `hooks/use-projects.ts` and `hooks/use-project-dialogs.ts`
  - `npm run build` passes (TypeScript clean)
- Feature 06: Project API
  - `app/api/projects/route.ts`: `GET` lists current user's projects (filtered by `ownerId = auth().userId`, ordered by `createdAt desc`); `POST` creates a project — `name` is **required** (blank/missing returns 400), optional `description`, owner set from Clerk userId. ID strategy at Feature 06 was the schema's `cuid()` default — **superseded by Feature 07**, which adds an optional client-provided `id` for room-ID alignment (the `cuid()` default still applies only when no `id` is supplied)
  - `app/api/projects/[projectId]/route.ts`: `PATCH` renames (trimmed `name` required, 400 on empty) and `DELETE` removes a project; both load the project, return 404 if missing, 403 if `ownerId !== userId`
  - All four routes return `401` for unauthenticated requests (`auth()` userId check before any DB work)
  - Backend-only — no UI wiring; sidebar/dialogs still use the in-memory `use-projects` hook
  - `npm run build` passes (TypeScript clean)
- Feature 05: Prisma Schema And Data Layer
  - `prisma/models/project.prisma`: `Project` (ownerId, name, description?, status enum DRAFT/ARCHIVED, canvasJsonPath?, createdAt/updatedAt, indexes on `ownerId` and `createdAt`) and `ProjectCollaborator` (projectId with cascade delete, email, createdAt, unique on `[projectId, email]`, indexes on `email` and `[projectId, createdAt]`)
  - Multi-file schema via `prisma.config.ts` (`schema: "prisma/"`); base `prisma/schema.prisma` keeps generator + datasource only
  - `lib/prisma.ts`: cached singleton on `globalThis` in non-production; branches on `DATABASE_URL` — `prisma+postgres://` → `new PrismaClient({ accelerateUrl })`, otherwise → `new PrismaClient({ adapter: new PrismaPg({ connectionString }) })`
  - Initial migration applied: `prisma/migrations/20260521150025_init/` creating both tables, enum, and indexes against the Prisma Postgres direct-TCP endpoint
  - Fixed `.env` / `.env.local` `DATABASE_URL` scheme typo (`ppostgres://` → `postgres://`) so `@prisma/adapter-pg` and the migration engine accept it
  - `npm run build` passes (TypeScript clean)
- Feature 04: Project Dialogs & Editor Home
  - `app/editor/page.tsx` empty state: heading `Create a project or open an existing one`, description, `New Project` button with `Plus` icon — no card wrapper
  - `hooks/use-projects.ts`: in-memory project state with `create`, `rename`, `remove` actions (seeded from `mockProjects` / `mockSharedProjects`); slug auto-regenerates on create/rename
  - `hooks/use-project-dialogs.ts`: accepts `onCreate` / `onRename` / `onDelete` handlers and dispatches the correct mutation on `submit` based on the active mode; manages dialog mode, active project, name input, and loading state
  - `components/editor/project-dialogs.tsx`: Create (live slug preview via `slugify`), Rename (prefilled, autofocus, Enter submits, current name in description), Delete (destructive confirm, no input, destructive button). Inputs use `text-copy-primary` so typed text is fully legible inside the popover
  - `components/editor/project-actions-context.tsx`: exposes `owned`, `shared`, and `openCreate` / `openRename` / `openDelete` so the sidebar and editor home consume live project state and trigger dialogs without prop drilling
  - `lib/projects.ts`: `slugify` helper + mock owned/shared seeds with `ownedByCurrentUser` flag
  - Sidebar rows: portaled action menu (`createPortal` to `document.body`) so the popover is not clipped by per-row stacking contexts — fixes a bug where clicking Rename on the first row activated the next row's menu. Menu shows only for owned projects; shared rows render no action affordance
  - Mobile backdrop scrim in `editor-chrome.tsx` (`lg:hidden`) — tapping outside closes the sidebar
  - `New Project` buttons in both the sidebar and editor home open the Create dialog; submitting creates, renames, or deletes the project in-memory and updates the list immediately
  - `npm run lint` clean; `tsc --noEmit` clean
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
