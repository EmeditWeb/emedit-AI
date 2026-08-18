# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 5: Realtime — Liveblocks wired into the workspace via a collaborative React Flow canvas, with drag-to-create shape support, proper shape rendering, and node resizing + inline label editing.

## Current Goal

- Feature 14: Node — resize handles on selected nodes + inline label editing (centered textarea, blur/Escape to close).

## Completed

- Feature 14: Node (resize + inline label editing)
  - `components/editor/canvas-node.tsx`: replaced the placeholder renderer with the full `CanvasNodeRenderer`. Adds `<NodeResizer isVisible={selected} minWidth={60} minHeight={40} color="rgba(0,200,212,0.8)" />` — handles show only on selection, min-size enforced, subtle cyan matching the dark canvas. Shape visuals (reused `ShapeOutline`) unchanged. Label stays centered (`flex items-center justify-center`); double-clicking anywhere on the node opens a `textarea` (`autoFocus`, `nopan nowheel` classes so typing never drags the node or pans the canvas, `resize-none`, centered text, dashed `brand` border, empty-label placeholder in the same centered spot). `Escape` closes via `onEndEdit`; `onBlur` closes and persists. Edit state is a single `editingId` in `CanvasFlow`, so only one node edits at a time
  - `components/editor/canvas.tsx`: `NODE_TYPES` module const removed — `nodeTypes` is now built in `useMemo` per render so each node gets `isEditing`, `onStartEdit`, `onChangeLabel`, `onEndEdit`. Label writes go through `NodeReplaceChange` (`type: "replace"` with `{ ...current, data: { ...current.data, label } }`) via `onNodesChange` — verified `applyChanges` in `@xyflow/react` supports the `replace` branch, so labels stay connected to the Liveblocks sync flow. Resize dimensions flow through the existing `onNodesChange` `dimensions` change path (NodeResizer dispatches them natively)
  - `npm run build` passes (TypeScript clean); `eslint` clean on touched files
- Feature 13: Shape Rendering + Drag Preview
  - `components/editor/shape-outline.tsx`: new shared `ShapeOutline` component. rectangle/pill/circle use CSS borders (rounded-md / rounded-full / 9999px), diamond/hexagon/cylinder render inline SVGs with `viewBox="0 0 100 100"` + `preserveAspectRatio="none"` so they scale with node size; `vectorEffect="non-scaling-stroke"` keeps strokes constant. Borders subtle at rest (2px, strokeOpacity 0.7) and brighter when `selected` (3px, opacity 1)
  - `components/editor/canvas-node.tsx`: now renders `<ShapeOutline shape={data.shape} color={data.color} selected={selected} />` — the Feature 12 simple-rectangle placeholder is gone
  - `components/editor/canvas.tsx`: `handleDragStart` (called from `ShapePanel` via new `onDragStart` prop) now also sets a `ghost` state. A fixed-position `DragGhost` overlay tracks the cursor via `onDragOver` client coords, centered on the pointer, sized to `SHAPE_DEFAULT_SIZES`, reusing `ShapeOutline` + the shape name label so the preview matches the drop node. Cleared on drop, dragend, or escape. Drop flow, panel layout, and ghost are unchanged otherwise
  - `components/editor/shape-panel.tsx`: drag-start logic lifted out — buttons now call `onDragStart(event, { shape, ...SHAPE_DEFAULT_SIZES[shape] })` (panel layout untouched per scope)
  - `npm run build` passes (TypeScript clean)
- Feature 12: Shape
  - `types/canvas.ts`: `CanvasNodeShape` union replaced with the spec's six shapes (`rectangle | diamond | circle | pill | cylinder | hexagon`). Added exported constants: `DEFAULT_NODE_COLOR = "#a78bfa"`, `SHAPE_DEFAULT_SIZES` (rectangle 160×80, diamond 140×120 — slightly larger for label room, circle 100×100 square, pill 160×60, cylinder 120×100, hexagon 140×100), `SHAPE_DRAG_MIME = "application/x-emedit-shape"`, and `ShapeDragPayload { shape, width, height }`
  - `components/editor/shape-panel.tsx`: floating pill-shaped toolbar absolutely positioned at `bottom-4 left-1/2 -translate-x-1/2` over the canvas. Six `draggable` icon buttons (lucide `Square`, `Diamond`, `Circle`, `Pill`, `Cylinder`, `Hexagon`); `onDragStart` writes `SHAPE_DRAG_MIME` data containing the serialized `ShapeDragPayload` and sets `effectAllowed = "move"`. Outer wrapper is `pointer-events-none`, inner bar `pointer-events-auto` so it does not block canvas pan/zoom outside the bar
  - `components/editor/canvas-node.tsx`: custom React Flow node renderer registered under the `canvasNode` type. Renders a simple bordered rectangle (border color = `data.color`) with the label centered and top/bottom `Handle`s — shape-specific visuals deferred to a later feature per spec (note: earlier draft implemented per-shape SVG outlines; trimmed back to the simple rectangle this unit requires)
  - `components/editor/canvas.tsx`: wrapped `<CanvasFlow />` in `ReactFlowProvider` so `useReactFlow()` is available; added `nodeTypes={{ canvasNode: CanvasNodeRenderer }}`; added `onDragOver` (preventDefault + `dropEffect = "move"`) and `onDrop` handlers on the canvas wrapper div. On drop, reads `SHAPE_DRAG_MIME` payload, converts client coords via `screenToFlowPosition`, generates an ID as `${shape}-${Date.now()}-${counter}` (counter held in `useRef` and incremented per drop), and dispatches a `NodeChange<CanvasNode>` of `type: "add"` through `onNodesChange` (the Liveblocks-backed hook does not expose `setNodes`, so add-changes are the correct API). New node uses empty `label`, `DEFAULT_NODE_COLOR`, the dragged shape, and the payload's width/height. Renders `<ShapePanel />` inside the wrapper
  - `npm run build` passes (TypeScript clean)
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

- Shape interaction fixes + text annotations/fonts (completed, verified):
  - **Connection handles**: all four sides were non-functional because the handles had no `id` — `getHandle()` in `@xyflow/system` resolves a null handle id to the **first** handle (`[...source, ...target]`), so every drag attached to the bottom source handle. Fixed by giving each handle a unique `id` (`target-top`, `target-left`, `source-bottom`, `source-right`) so `getHandle` returns the correct port. In the default Loose connection mode every handle now starts and ends connections (`isConnectableStart`/`isConnectableEnd` default true). Top/Left ports are `target`, Bottom/Right are `source`.
  - **Text annotations**: double-clicking empty canvas creates a free-standing `shape: "text"` node (new `CanvasNodeShape` member) centered at the cursor, no outline, no handles, freely resizable (`keepAspectRatio={false}` for text), and it auto-enters inline edit mode via `setEditingId`. Detected with `onPaneClick` timing (this React Flow fork exposes `onPaneClick` but **no** `onPaneDoubleClick`), so `handlePaneClick` tracks the last click and fires `createTextNode` within 300ms/8px. `zoomOnDoubleClick={false}` so double-click doesn't also zoom.
  - **Fonts**: 11 curated fonts self-hosted via `next/font/google` in new `components/editor/canvas-fonts.ts`, applied as CSS variables on the canvas wrapper. A `NodeToolbar` above any selected node shows a font `<select>`; the choice writes `data.font` through the same `replace` change path (`updateNodeData` generalizes the old `replaceLabel`). `fontCssVar()` maps the stored key to a CSS var; labels/textarea render with the chosen `fontFamily`. Data model extended with `CanvasNodeData.font`, `TEXT_NODE_COLOR`, `TEXT_DEFAULT_SIZE`.
  - **Multiline labels**: label and textarea use `whiteSpace: "pre-wrap"` so pressing Enter in the textarea renders a real line break instead of collapsing to a space.
  - **Font size**: `CanvasNodeData.fontSize` (optional) added; the toolbar gained a numeric Size input (8–96px, clamped). When set it overrides the width-derived auto scale (`data.fontSize ?? scaleFont(width)`); otherwise size keeps following node width.
  - Earlier label/resize polish (carried into this entry): label font scales with node width via `scaleFont` and wraps (`wordBreak: "break-word"`, `overflow: hidden`, `lineHeight: 1.2`) instead of truncating to "…"; `<NodeResizer keepAspectRatio>` keeps shape nodes proportional so a circle stays round; a `no-scrollbar` `@utility` in `app/globals.css` hides the textarea scrollbar when pressing Enter.
  - `types/canvas.ts`: `"text"` added to `CanvasNodeShape`; `ShapePanel` untouched (uses its own fixed 6-button list).
  - `tsc --noEmit` + `eslint` + `npm run build` pass.

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
