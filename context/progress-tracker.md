# Progress Tracker

Update this file whenever the current phase, active feature, or implementation state changes.

## Current Phase

- Phase 5: Realtime — Liveblocks wired into the workspace via a collaborative React Flow canvas, with drag-to-create shape support, proper shape rendering, node resizing + inline label editing, free-standing text annotations, a floating node style toolbar (font, size, color themes), edge labels, zoom/undo-redo controls + keyboard shortcuts, and an importable starter-template library.

## Current Goal

- Starter Template Library — importable prebuilt diagrams opened from the editor navbar, with lightweight SVG previews and canvas-replacing import.

## Completed

- Room presence: collaborator avatars + live cursors (canvas view only)
  - `liveblocks.config.ts`: presence type now `{ cursor: { x, y } | null; thinking: boolean }` — `isThinking` renamed to `thinking` to match the presence contract. `cursor` is the key the React Flow cursors layer writes to and reads from.
  - `components/editor/presence-overlay.tsx` (new): the presence group pinned to the canvas top-right (`absolute top-3 right-3`, above the flow). Resolves the current user via Clerk `useUser()` and filters the Liveblocks `useOthers()` list to exclude `other.id === user.id` (the auth route already identifies Liveblocks users with the Clerk user id, so the IDs line up). Renders up to 5 overlapping collaborator avatars (photo via `<img>` when `other.info.avatar` exists, else initials on the participant's `color`), a `+N` overflow chip past 5, a 1px divider only when at least one collaborator exists, then the Clerk `UserButton` for the current user — same `h-7 w-7` size as the avatars. Avatars are display-only (`title` tooltip, no handlers); avatars/chip carry a dark `ring-2 ring-[#0a0a12]` so the stack stays readable on the dark canvas. Rendered inside `CanvasFlow`'s wrapper, so it exists only in the room view — the shared navbar is untouched.
  - `components/editor/canvas.tsx`: added the bundled `<Cursors />` component (from `@liveblocks/react-flow`) as a child of `<ReactFlow>`. It broadcasts the current user's cursor via `useUpdateMyPresence` on `pointermove` (converting screen→flow coords with `screenToFlowPosition`, skipped while panning), clears to `null` on pointer leave/blur, and renders only *other* participants' cursors (from `useOthersConnectionIds`), positioned through the live viewport transform with a spring. Each cursor reuses the `@liveblocks/react-ui` `Cursor` (colored pointer + name badge), colored from `user.info.color` set by the auth route's `getCursorColorForUser`. `RoomProvider initialPresence` updated to `{ cursor: null, thinking: false }`.
  - `tsc --noEmit`, `eslint`, and `npm run build` all pass.

- Starter Template Library (spec provided by the user)
  - `components/editor/starter-templates.ts` (new): `CanvasTemplate { id, name, description, nodes, edges }` + `CANVAS_TEMPLATES` with 10 templates — Microservices, CI/CD Pipeline, Event-Driven, Auth Flow, API Gateway, Rate Limiting, Sliding Window, Next.js, NestJS, Payment Gateway. Built with tiny helpers `node()`/`text()`/`edge()` that wrap the shared `types/canvas.ts` types, `NODE_COLORS` pairs, `SHAPE_DEFAULT_SIZES`, `TEXT_DEFAULT_SIZE`, `TEXT_NODE_COLOR`, and `DEFAULT_FONT_KEY`, so imported nodes/edges match the canvas data model exactly. `node()` derives `color`/`bg` from `NODE_COLORS` by key; text-title nodes and labeled edges are supported.
  - `components/editor/starter-templates-modal.tsx` (new): an `Import Template` dialog (`rounded-2xl`) with a bold heading, a short "…any existing nodes will be replaced, use ⌘Z to undo" subtitle, and a custom close button that clears the modal edge. The grid is horizontally oriented — `grid-cols-1 sm:grid-cols-[repeat(auto-fill,minmax(240px,1fr))]` with `gap-7` — so cards hold a 240px floor and the column count degrades on its own (5 → 4 → 3 → 2 → 1) instead of squeezing card width. Verified in a headless Chromium render at 1920/1440/1280/1024/768: 5/5/4/3/2 columns, card width 245–306px, every title on one line, no clipped descriptions, and `document.scrollWidth === window.innerWidth` at all five widths (no horizontal scroll). Each card is a rounded surface with inset highlight + drop shadow: a large pure-SVG preview (side-anchored, source-colored curved edges, filled shapes, dotted canvas background), the description, and a full-width primary Import CTA at the bottom. The preview is an `aspect-[8/5] w-full` SVG on a 320x200 viewBox, so it scales with the card rather than sitting as a small letterboxed icon. Card body is `p-5`/`gap-2`; the title is `line-clamp-2 break-words` and the description `line-clamp-3 break-words`, so text wraps on word boundaries and ellipsizes rather than breaking mid-word. No React Flow, no Liveblocks — previews are static SVG only.
  - `components/editor/workspace-context.tsx`: added `isStarterTemplatesOpen` + `openStarterTemplates`/`closeStarterTemplates` so the navbar button and the canvas modal share the open state across the workspace tree.
  - `components/editor/editor-navbar.tsx`: added a "Templates" ghost button (`LayoutTemplate` icon) beside Share, visible only when a project is active; opens the modal via `openStarterTemplates`.
  - `components/editor/canvas.tsx`: `CanvasFlow` reads the modal state from `useWorkspace` and renders `<StarterTemplatesModal>`. `handleImportTemplate` rewrites node/edge ids with a per-import `{templateId}-{stamp}-{original}` suffix, maps edge source/target through the id map, clears the canvas via the collaborative `onDelete({ nodes, edges })` (the working delete path — `remove` changes are a no-op in this bundle), adds the template through `onNodesChange`/`onEdgesChange` `add` changes, closes the modal, then `flow.fitView({ padding: 0.2, duration: 300 })` on the next animation frame so the freshly-added nodes are measured. All mutations stay inside the Liveblocks flow state.
  - Modal width: `DialogContent`'s base class list carries `sm:max-w-sm`, and tailwind-merge does not dedupe a responsive-prefixed utility against an unprefixed one — so the earlier `max-w-7xl` was silently overridden and the dialog was pinned at 24rem on every desktop viewport. Fixed by passing both `max-w-[1400px]` and `sm:max-w-[1400px]` alongside `w-[calc(100vw-4rem)]`. Any future width override on a shadcn dialog must set the `sm:` variant too.
  - Preview node labels are baked into the SVG and cannot rely on CSS wrapping, so `truncateToWidth()` clips each label to its glyph width with an ellipsis. Without it, long labels spilled past their shapes and were clipped at the SVG edge.
  - Template edges use the `canvasEdge` type, which is registered in `edgeTypes` (alongside `default`), so imported labeled edges render. `tsc --noEmit` and `eslint` clean; `npm run build` passes.

- Fix: connections rejected on half of each node, edges bending inward
  - Root cause: nodes declared `type="target"` handles on top/left and `type="source"` handles on bottom/right. In React Flow's default strict connection mode a source only connects to a target, so the top and left points refused to start a connection and the bottom and right points refused to accept one. Edges then had to reach the one legal handle, which is what produced the long inward detours.
  - `components/editor/canvas.tsx`: added `connectionMode={ConnectionMode.Loose}` — handle `type` no longer restricts connections, so all four sides both start and accept. Handle ids (`target-top`, `source-bottom`, …) are deliberately unchanged so edges saved before this still resolve.
  - `components/editor/canvas-node.tsx`: the handle element is now a 16px invisible grab target with the visible 7px dot painted by a radial gradient (`HANDLE_DOT` / `HANDLE_HIT`). A 7px hit area — invisible until selection — was too small to reliably grab, which contributed to connections that would not start.
  - Text annotations still have no handles (Feature 15 scope: they are plain text boxes, no outline and no connection points).

- Fix: new workspace missing from the sidebar until reload
  - `hooks/use-project-actions.ts`: the create branch called `router.refresh()` **before** `router.push()`. The router processes queued actions in order, so the refresh revalidated the route being left, and the push then rendered the new route reusing the already-cached `/editor` layout — the layout holds the sidebar project list, and shared layouts are not re-fetched on navigation to a nested route. Swapped to `push()` then `refresh()` so the refresh applies to the new route and re-fetches the layout.
  - `app/api/projects/route.ts` and `app/api/projects/[projectId]/route.ts`: `revalidatePath("/editor")` → `revalidatePath("/editor", "layout")`. The page-scoped form only invalidated the `/editor` page, never the layout that actually renders the list (create/rename/delete all shared this gap).

- Node Color Themes + Style Toolbar (spec: `context/feature-specs/15-text-annotation.md`)
  - `types/canvas.ts`: added `NodeColorPair { key, label, bg, text }` and `NODE_COLORS` — the 8 pairs documented in `ui-context.md` (neutral, blue, purple, orange, red, pink, green, teal). No new `globals.css` tokens: these are canvas data values written into node data, not theme surfaces. `DEFAULT_NODE_COLOR_PAIR`/`DEFAULT_NODE_COLOR` (`#FFFFFF`)/`DEFAULT_NODE_BG` (`#000000`) replace the old `#a78bfa` default. `CanvasNodeData` gains `bg?: string` — `color` stays the accent (outline + label text), `bg` is the fill, so one swatch drives both without a second lookup at render time.
  - `components/editor/color-swatches.tsx` (new): one round swatch per pair (fill = `pair.bg`, border = `pair.text`). Active pair is matched on `pair.text === data.color` and gets a tight 1.5px ring plus a slight scale; hover applies a controlled glow (`0 0 0 1px <text>, 0 0 6px <text>80`) — deliberately short-radius, not a soft bloom.
  - `components/editor/font-select.tsx` (new): replaces the native `<select>`. The OS list rendered as a wide horizontal-spreading popup that ignored the canvas theme, so the picker is now a custom listbox — a pill trigger (`rounded-full`, 104px, truncating label + chevron) opening a vertical `rounded-2xl` panel of `rounded-full` options, each previewed in its own font, scrollable (`max-h-56`, `no-scrollbar`, `nowheel`). Closes on outside `pointerdown` or `Escape`.
  - `components/editor/node-style-toolbar.tsx` (new): the `NodeToolbar` markup lifted out of `canvas-node.tsx` (which was heading past a comfortable size) and redesigned as a single `rounded-full` bar — `FONT [select] SIZE [n] | ●●●●●●●●`. The size input dropped from `w-14` to `w-8` with centered text and the label paddings tightened, which is what freed the horizontal room for the swatch row. Font-size clamping (8–96, fallback to the width-derived auto size) moved here with the input. `nodrag nopan` on the bar plus `stopPropagation` on `mousedown`/`doubleclick` keeps toolbar clicks from dragging the node or panning the canvas.
  - `components/editor/shape-outline.tsx`: takes an optional `bg` and uses it as the shape fill, falling back to the previous `rgba(20,20,28,0.85)` for nodes created before this change.
  - `components/editor/canvas-node.tsx`: label color is now `data.color` for every node (previously only text nodes), so a swatch updates shape labels too; `bg` is forwarded to `ShapeOutline`. Text annotations have no outline, so they take the pair's text color only.
  - `components/editor/canvas.tsx`: `handleChangeColor` writes `{ color: pair.text, bg: pair.bg }` through the existing `updateNodeData` `replace` change — collaborative state only, no server calls. New dropped shapes and the drag ghost start on the default pair.
  - Default pair is black on white text (`#000000` / `#FFFFFF`) — new nodes render black with white labels; the swatch row leads with it.
  - Connection handles: `handleStyle(selected)` in `canvas-node.tsx` renders all four handles at 7px round with a dark hairline border and `opacity: 0` until the node is selected (150ms fade in). Pointer events stay on while hidden, so dragging a connection off an unselected node still works — connection behavior is unchanged, only the resting visuals. `NodeResizer` handles were rounded and matched to the same 7px size so selection reads as one consistent set of dots.
  - Border weight pass (matching the reference canvas screenshots): `NodeResizer` gets `lineStyle={{ borderColor: "transparent" }}` so a selected node no longer draws a rectangular bounding box around the shape — the corner handles alone mark selection, and the box no longer boxes in diamonds/circles/hexagons. Shape outlines dropped from 2px/3px at 70–100% to 1px/1.5px at 55%/90%; the cylinder's cap line renders at 70% of that. CSS-border shapes (rectangle, circle, pill) cannot use SVG `strokeOpacity`, so `withOpacity()` in `shape-outline.tsx` folds the alpha into an `rgba()` border color (non-hex values pass through unchanged).
  - `npm run build` and `tsc --noEmit` pass; `eslint` clean on all touched files (the one repo-wide error is the pre-existing `share-dialog.tsx` effect from Feature 09).

- Connection handles on all four sides (every node) + edge labels
  - Bug fixed: the top/left handles were un-grabbable on some shapes (diamond, hexagon). The shape outline rendered **after** the top/left handles in the DOM, so it sat on top and swallowed pointer events at the top/left edge; bottom/right handles rendered after the shape and worked. Fixed by pulling `ShapeOutline` ahead of the handle block and rendering **all four** handles last (top, left, bottom, right) for **every** node — shapes and text annotations — so they always paint above the shape. Each handle gets `isConnectableStart` + `isConnectableEnd` (`@xyflow/system` defaults them true; made explicit), so any handle can both accept and create a connection in the default Loose mode.
  - Handles restyled per the current ask: small 7px white dots with a dark `#0a0a12` hairline border, `zIndex: 2`. Hidden by default (`opacity: 0`, `pointerEvents: none` when hidden so the invisible dot never blocks node dragging) and fade in on node hover **or** selection (150ms).
  - Edge labels: new `components/editor/canvas-edge.tsx` custom edge renders the label with `EdgeLabelRenderer` anchored to the path midpoint (`getSmoothStepPath` returns `[path, labelX, labelY]`). Double-click the pill (or the edge — `onEdgeDoubleClick`) opens an inline input; Enter/blur commits `edge.data.label` through the collaborative `onEdgesChange` replace path (`handleChangeEdgeLabel` in `canvas.tsx`), Escape restores. Empty label shows a "+ label" affordance only while the edge is selected. `edgeTypes` registers the renderer under both `canvasEdge` and `default` (Liveblocks' `onConnect` creates edges with the built-in `default` type). `CanvasEdgeData` gained `label?: string` in `types/canvas.ts`.
  - `npm run build` and `tsc --noEmit` pass; `eslint` clean on touched files.

- Feature 15: Text Annotations + Font Picker
  - `types/canvas.ts`: added `"text"` to `CanvasNodeShape`; `TEXT_NODE_COLOR = "#f0f0f4"`; `TEXT_DEFAULT_SIZE = { width: 240, height: 96 }` (also added to `SHAPE_DEFAULT_SIZES`); extended `CanvasNodeData` with `font` and optional `fontSize`.
  - `components/editor/canvas-fonts.ts` (new): 11 curated fonts self-hosted via `next/font/google` (`Inter`, `Space Grotesk`, `Poppins`, `Nunito`, `Raleway`, `DM Sans`, `Playfair Display`, `Merriweather`, `JetBrains Mono`, `Caveat`, `Bebas Neue` + Geist), each exposing a `--font-canvas-*` CSS variable. `CANVAS_FONTS` maps key → label → cssVar; `DEFAULT_FONT_KEY = "geist"`; `fontCssVar()` resolves a stored key to its CSS var (fallback Geist); `CANVAS_FONT_VARIABLES` is applied to the canvas wrapper.
  - `components/editor/canvas.tsx`:
    - Text annotation creation. This React Flow fork exposes `onPaneClick` but no double-click handler, so `handlePaneClick` tracks the last click (coords + timestamp in a ref) and fires `createTextNode` when two clicks land within 300ms/8px. Creates a `shape: "text"` node under the existing `canvasNode` type, centered on the cursor point, `TEXT_DEFAULT_SIZE` size, and immediately enters inline edit via `setEditingId`. Dispatched through the collaborative `onNodesChange` `add` change path. `zoomOnDoubleClick={false}` prevents double-click-to-zoom.
    - `updateNodeData` generalizes the old `replaceLabel` so font changes flow through the standard `replace` change (`{ ...current, data: { ...current.data, font } }`), keeping updates connected to the Liveblocks sync path. `handleChangeFontSize` writes `data.fontSize` through the same path.
  - `components/editor/canvas-node.tsx`:
    - Text nodes render as a plain resizable text box: `handle`s and `<ShapeOutline>` are gated behind `!isTextNode`, so annotations have no outline and no connection handles.
    - `<NodeResizer keepAspectRatio={!isTextNode}>` — text resizes freely (no aspect lock); shapes stay proportional.
    - Selected nodes show a `NodeToolbar` (`Position.Top`) with a font `<select>` listing `CANVAS_FONTS`; choosing a font writes `data.font` via `onChangeFont`. The value applies to both shape labels and annotation text (`fontFamily = fontCssVar(data.font)`), and labels/textarea use `whiteSpace: "pre-wrap"` so Enter renders a real line break.
    - Label font scales with node width via `scaleFont` (existing resize behavior). The toolbar also carries a numeric Size input (8–96px, clamped) that writes `data.fontSize`; when set it overrides the width-derived auto scale (`data.fontSize ?? scaleFont(width)`), otherwise size keeps following node width.
  - Node deletion (from the prior session, still active): hover/selection shows a trash button at the node's bottom-right corner; `handleDeleteNode` uses the Liveblocks `onDelete` (not the `remove` change, which is a no-op in this bundle) to remove the node + connected edges.
  - `tsc --noEmit`, `eslint`, and `npm run build` all pass.
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

- Hardening + UX polish pass
  - **Rate limiting + uniform gating on every API route.** New `lib/rate-limit.ts`: in-memory fixed-window limiter keyed by `userId` + scope, `gateRequest(key, scope)` returns a 429 `Retry-After` response or null. Scopes: `read` (60/min), `list` (120/min), `mutate` (20/min), `liveblocks` (30/min); opportunistic sweep keeps the table bounded. Applied to all 10 routes — `invitations` (GET `list`, POST `mutate`), `liveblocks-auth` (POST `liveblocks`), `notifications` (GET `list`, POST `mutate`), `projects` (GET `read`, POST `mutate`), `projects/[projectId]` (PATCH/DELETE `mutate`), `projects/[projectId]/access` (GET `read`), `projects/summary` (GET `list`), `collaborators` (GET `read`, POST/DELETE `mutate`), `collaborators/[collaboratorId]` (PATCH `mutate`). Also hardened the two GETs that previously returned empty lists when signed out (`/api/invitations`, `/api/projects/summary`): they now require `auth()` and 401 explicitly.
  - **Dead code.** `tsc`/`eslint` full-scan found no orphaned files or unused exports; removed the one stale unused import (`cn` in `notifications-button.tsx`). (Aside: `tsconfig.tsbuildinfo` is a committed build artifact — now stale; recommended adding to `.gitignore`.)
  - **Live collaborator status in the Share palette.** `share-dialog.tsx` now polls `GET /api/projects/[projectId]/collaborators` every 5s while open (silent refresh, no spinner flash), so when an invited person accepts, their `PENDING` badge flips to `ACTIVE`/role live without a reload. Re-factored the loaders to satisfy `react-hooks/set-state-in-effect`: loading is adopted into the dialog via the render-time `lastOpen` adjustment, and the fetch runs inside the effect's own async function (as in `use-notifications`) — the previously-known lint error here is now gone.
  - **Notifications palette shows only unread**, so a read event disappears immediately: the existing top-right "Mark all read" (and per-item tap) now empties the list to the "No notifications" default state. Removed now-dead read-tint branches.
  - **Credentials-login blank screen fix.** Root cause: username/password sign-in does a client-side navigation before the session cookie commits (OAuth does a full-page redirect, which is why OAuth worked). Layered fix: added `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/editor` + `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/editor` to `.env.local`; hardened `app/editor/layout.tsx` with a try/catch fallback to empty, typed lists (`ProjectSummary[]`/`PendingInvitation[]`); added a client `useAuth` gate in `editor-chrome.tsx` — while `!isLoaded` or `!isSignedIn` it shows a centered `AuthLoading` spinner ("Loading workspace…") instead of a blank screen; added `app/editor/error.tsx` ("Something went wrong" + "Reload workspace" button).
  - **UI polish.** Removed `hover:underline` from the mark-all-read button (`notifications-button.tsx`); added `no-scrollbar` to the Templates modal grid (`starter-templates-modal.tsx`) so the right slider is invisible.
  - **Empty-canvas onboarding.** `canvas.tsx`: when `nodes.length === 0` and the canvas is owned, `CanvasEmptyState` overlay shows (Sparkles icon, "Start a new architecture workspace", "Bring your first idea to life…", "Browse templates" button calling `openStarterTemplates` from workspace context; view-only variant: "ask the owner"). Backdrop is `pointer-events-none` so drops/double-clicks pass through; disappears the instant the first node lands.
  - **A11y audit (complete).** Scanned every editor component for unlabeled interactivity. `shape-panel`, `canvas-controls`, `color-swatches`, `font-select`, `node-style-toolbar`, `project-sidebar`, `project-dialogs`, `access-denied`, `workspace-access-guard`, `small-screen-gate`, `share-dialog`, `notifications-button`, `presence-overlay`, and `starter-templates-modal` already carried `aria-label`/`title`/alt/`role` (e.g. template preview SVG is `role="img" aria-label="<name> preview"`; the Share/rename/delete rows are label-scoped). Two gaps found and fixed: the inline node label `textarea` (`canvas-node.tsx`) and the edge label `input` (`canvas-edge.tsx`) had placeholders but no accessible name — added `aria-label="Edit node label"` / `aria-label="Edit edge label"`. Everything else (delete-node button, avatar stack, overflow chip) already labeled.

- Missed-event notifications (bell) + live-shared-list refresh
  - Prisma: new `ProjectNotification` model (`prisma/models/notification.prisma`): `userId`, `projectId`, `projectName`, `type` enum `PROJECT_DELETED | INVITED`, `readAt`, `createdAt`; indexes on `[userId, readAt]`, `[userId, createdAt]`. Migration `20260820133417_add_notifications` applied; client regenerated (`prisma generate`).
  - `app/api/projects/[projectId]/route.ts` `DELETE`: before dropping the project it resolves each active collaborator's Clerk user id (`getUserIdByEmail`), dedupes, and `createMany`s a `PROJECT_DELETED` notification (best-effort try/catch, recipients exclude the owner).
  - `app/api/notifications/route.ts` (new): `GET` returns the caller's notifications (`read` derived from `readAt`, unread-first ordering, take 50); `POST` marks one (`{ id }`) or all read.
  - `lib/notifications.ts` (new): shared `ClientNotification` type.
  - `hooks/use-notifications.ts` (new): polls `/api/notifications` every 8s, optimistic local read flags + `markRead`/`markAllRead`.
  - `components/editor/notifications-button.tsx` (new): bell button with unread-count badge (destructive pill) opening a `rounded-2xl` palette listing missed events ("Workspace deleted — "X" was removed by its owner" + relative time), click marks read, "Mark all read" header action, unread rows tinted with a trailing dot; closes on outside click / Escape. Mounted in `editor-navbar.tsx` right section beside Templates (visible even without an active project).
  - `editor-navbar.tsx`: header got `z-50` so the palette always paints above the canvas workspace (its panels otherwise stacked over the unmounted dropdown's area — the dropdown rendered behind the canvas on project pages).
  - Delete-warning wording clarified in `project-dialogs.tsx`: collaborators with the workspace open see a deleted notice immediately; offline ones simply won't find it in their lists (they get the bell notification on their next login).
  - Live Shared list for the owner: `app/api/projects/summary/route.ts` (new, static segment wins over `[projectId]`) returns `{ owned, shared }` from `getProjectsForCurrentUser()`; `hooks/use-live-projects.ts` polls it every 8s and adopts server-prop changes during render; `editor-chrome.tsx` now feeds live `owned`/`shared` into the project-actions context, so a workspace the owner just shared shows up under Shared without a reload.
  - **Gotcha — notifications 500 "Cannot read properties of undefined (reading 'findMany')" was the dev server's stale generated Prisma bundle** (started before `prisma generate`). The generated client does contain `projectNotification`; a fresh server start resolves it — verified by starting a new server and probing `/api/notifications` (auth-redirect, no 500). Any future Prisma schema change requires a dev-server restart.
  - `tsc --noEmit`, `eslint`, and `npm run build` all pass.

- Shared tab: show all collaborative workspaces with an owner badge
  - `lib/projects.ts`: `ProjectSummary` gains optional `isShared`.
  - `lib/projects-data.ts`: the owned query now also selects an active-collaborator count (`_count.collaborators` filtered to `status: "ACTIVE"`); owned rows are marked `isShared` when that count > 0, and shared-with-you rows are always `isShared`. (via extended `toSummary(row, ..., isShared)`)
  - `components/editor/project-sidebar.tsx`: the Shared tab now lists `[...owned.filter(isShared), ...shared]` — workspaces you own and shared with others appear too, not just ones shared with you. `ProjectList`/`ProjectRow` take a `context: "my" | "shared"` prop; in the Shared context an owner row renders a distinct always-visible crown badge (`Crown` in a brand-tinted pill, rightmost) signifying the current user is the owner. Shared-with-you rows show no badge. My-tab rows are unchanged.
  - `tsc --noEmit` and `eslint` clean on touched files.

- Fix: workspace delete — warning modal + immediate collaborator reflection
  - `components/editor/project-dialogs.tsx`: `DeleteProjectDialog` retitled "Delete workspace" and now shows a warning panel (destructive-tinted, `AlertTriangle`-style text) explaining the implications — the deletion is permanent, canvases are gone, and **every collaborator loses access immediately**. Confirms before the destructive button.
  - Real-time reflection of deletion on a collaborator's open canvas:
    - `app/api/projects/[projectId]/access/route.ts` (new): `GET` access probe returning `{ ok: false, reason: "deleted" }` when the project row no longer exists, else `{ ok: false, reason: "denied" }`; `{ ok: true }` when reachable.
    - `hooks/use-workspace-access.ts` (new): polls that endpoint every 5s while a workspace is open; flips to a non-ok state the moment access is lost.
    - `components/editor/workspace-access-guard.tsx` (new): wraps the canvas; if access is lost it replaces the canvas immediately with a deleted/denied notice ("This workspace was deleted by its owner" vs the original "You don't have access" copy) plus a Back to projects link. Wired into `workspace-shell.tsx` around `<Canvas>`.
    - `app/api/projects/[projectId]/route.ts` `DELETE`: after dropping the DB row, best-effort `getLiveblocksClient().deleteRoom(projectId)` so connected collaborators lose their live room connection too (guarded by try/catch so a Liveblocks failure never blocks deletion).
  - `tsc --noEmit` and `eslint` clean on all touched files.

- Fix: text boxes not stretching with typed content (words/font-size cut "inwards"; label spills past the box)
  - `components/editor/canvas-node.tsx`: text nodes no longer soft-wrap. The label wrapper and the inline textarea moved from `whiteSpace: "pre-wrap"` + `wordBreak: "break-word"` to `whiteSpace: "pre"` (and `overflowWrap: "normal"` on the textarea), so line breaks exist only where the user presses Enter. Wrapper `overflow` is now `visible` for text nodes so no inward clipping can occur while the box is catching up.
  - Auto-sizing: a hidden measurement span (`useLayoutEffect` + `measureRef` ghost, `whiteSpace: "pre"` + `w-max`) measures the unwrapped label width/height and reports it via a new `onAutoSize` prop. Font base for texts is fixed at `TEXT_BASE_FONT_SIZE = 16` (previously the width-scaled `scaleFont`, which made the box fight the text size), `data.fontSize` still overrides it.
  - `components/editor/canvas.tsx`: new `handleAutoSize` sizes the node deterministically — it writes `width`/`height` into the node object via the standard `replace` change (the same channel typing uses, so it cannot be lost in the Liveblocks round-trip) **plus** a `dimensions` change (`setAttributes: true`) to keep React Flow's measured bounds in sync. The earlier dimensions-only version did not reliably grow the box.
  - Node drag: the label span was `pointer-events-auto` + `nodrag nopan`, which swallowed the drag and panned the canvas instead of moving the node. Now `pointer-events-none`, so pressing on a text node drags the node exactly like a shape; editing/selection still work through the overlay textarea and double-click.
  - Edit-position jump (verified in a headless Chromium harness): the editing `textarea` is top-aligned and its default `rows="2"` gives it an intrinsic ~40px height regardless of content, so inside the `flex items-center` wrapper the text line sat ~10px above box-center (text "moved up"), snapping back on blur. Fixed with `rows={1}` + `overflow-hidden` plus an auto-height `useLayoutEffect` (`el.style.height = auto; el.style.height = scrollHeight`) so the box hugs its own text and flex-centering holds the caret on the static label's line. Single-line offset measured 0.1px; multi-line centers the whole block exactly like the static label.
  - `tsc --noEmit` and `eslint` pass on both files; dev server compiles and serves the editor without runtime errors.

## Next Up

- Add the next planned feature unit here.

- Canvas zoom + undo/redo controls & keyboard shortcuts (completed, verified)
  - `components/editor/canvas-controls.tsx` (new): pill-shaped floating bar pinned `bottom-4 left-4` (bottom-left, above the shape panel, `z-10`). Left group = zoom out / fit view / zoom in (`Minus`, `Maximize2`, `Plus`); right group = undo / redo (`Undo2`, `Redo2`) after a thin vertical divider (`h-4 w-px bg-surface-border`). Zoom uses the React Flow instance (`useReactFlow`) with animated viewport helpers (`zoomOut/zoomIn({ duration: 200 })`, `fitView({ duration: 250 })`). Undo/redo drive the collaborative Liveblocks history via `useUndo()`/`useRedo()`; buttons disable and dim (`opacity-35`, `pointer-events-none`) via reactive `useCanUndo()`/`useCanRedo()`.
  - `hooks/use-keyboard-shortcuts.ts` (new): `useKeyboardShortcuts({ flow, onUndo, onRedo, enabled })` — generic over node/edge types, listens on `window`, ignores targets in `INPUT`/`TEXTAREA` or `isContentEditable`. Shortcuts: `+`/`=` zoom in, `-` zoom out (animated, 200ms), `Cmd/Ctrl+Z` undo, `Cmd/Ctrl+Shift+Z` / `Cmd/Ctrl+Y` redo. Uses direct values in the effect deps (no ref mutation during render — satisfies the project's `react-hooks/refs` lint).
  - `components/editor/canvas.tsx`: `CanvasFlow` now pulls the flow instance once (`const flow = useReactFlow<CanvasNode, CanvasEdge>()`), wires `useCanUndo/useCanRedo/useUndo/useRedo`, calls `useKeyboardShortcuts`, and renders `<CanvasControls />` above the shape panel. Shape panel, node/edge rendering, and the collaborative state setup unchanged.
  - `tsc --noEmit`, `eslint`, and `npm run build` all pass.

- Collaborator RBAC, additive template import, and the desktop-only gate (completed)
  - `prisma/models/project.prisma` + migration `20260819160000_add_collaborator_can_edit`:
    `ProjectCollaborator.canEdit Boolean @default(false)`. The migration backfills
    `canEdit = true` for rows that already existed, because before this change every
    authorised member received `room:write`; demoting them silently would have pulled
    access out from under people mid-session. New invites default to view-only.
  - `lib/project-access.ts`: `AccessibleProject` gains `canEdit` (owner OR the matched
    active collaborator's flag). `getProjectForAccess` now returns the membership row
    rather than a boolean so the flag can be read.
  - `app/api/liveblocks-auth/route.ts`: the room grant is the real permission boundary —
    editors get `["room:write"]`, viewers `["room:read", "room:presence:write"]`. Viewers
    keep cursors/presence but the Liveblocks server rejects storage writes, so bypassing
    the client UI achieves nothing.
  - `collaborators/route.ts`: GET returns per-row `canEdit` plus the caller's own; POST
    accepts `canEdit` at invite time and honours it **only when the caller is the owner**
    (a `canShare` collaborator can invite, but never grant edit).
  - `collaborators/[collaboratorId]/route.ts`: PATCH accepts `canShare` and/or `canEdit`
    (both now optional, at least one required) and calls `syncRoomAccess()` so a revoked
    collaborator loses write access on their live connection instead of at token expiry.
    `lib/collaborators.ts` gained `getUserIdByEmail()` for that Clerk email -> id lookup.
  - `components/editor/canvas.tsx`: `Canvas`/`CanvasFlow` take `canEdit` as a prop
    (from the server-resolved project, not `activeProject`, which is null on first render
    and would flash the shape panel). Every mutation path early-returns for viewers, and
    `onNodesChange`/`onEdgesChange` are wrapped to let only local `select`/`dimensions`
    changes through so the canvas stays navigable. `nodesDraggable`, `nodesConnectable`,
    `edgesReconnectable`, `onConnect`, `onDelete` and `deleteKeyCode` are all gated;
    the shape panel is replaced by a `ViewOnlyBadge`.
  - Additive import: `handleImportTemplate` no longer calls `onDelete({ nodes, edges })`.
    `importOffsetFor()` places the template `IMPORT_GAP` (120px) to the right of the
    existing content's bounding box with tops aligned, returning a zero offset on an
    empty canvas. Verified against synthetic cases: empty canvas, negative coordinates,
    and three successive imports all keep a clean 120px gap with no overlap.
  - `components/editor/small-screen-gate.tsx` (new): non-dismissible blocker below
    `WORKSPACE_MIN_WIDTH` (1024px), driven by `matchMedia` and starting `null` so the
    first client render matches SSR. `workspace-shell.tsx` renders it and marks the
    workspace `inert` while blocked so keyboard focus cannot reach the canvas behind it.
    Verified: shown at 375/768/1023, absent at 1024/1440, pointer events blocked, and it
    clears on live resize without a reload.
  - `share-dialog.tsx`: owner-only "Invite as [Can view | Can edit]" segmented control
    (`RoleOption`), a per-collaborator pencil toggle for edit access, badges now read
    `CAN EDIT` / `VIEW ONLY` / `PENDING`, and `handleToggleCanShare` was generalised into
    `patchPermission(row, patch)`.
  - **Gotcha — `text-base` is a COLOUR utility in this project.** `globals.css` defines
    `--color-base: var(--bg-base)` (`#080809`), so Tailwind emits `.text-base { color: #080809 }`.
    Adding `text-base` to the dialog title rendered it near-black on the dark popover.
    Use the numeric type scale (`text-sm`, `text-lg`, `text-[15px]`) and never `text-base`.
    Note `components/ui/dialog.tsx` and `card.tsx` carry `text-base` in their base classes,
    so **any `DialogTitle`/`CardTitle` without a font-size override renders near-invisible** —
    the three titles in `project-dialogs.tsx` are currently affected (untouched, out of scope).
  - Modal responsiveness: `DialogContent` is now `flex flex-col max-h-[90dvh]` with a fixed
    header and the grid as the only scroll region, so the Import button is always reachable.
    The grid needs `content-start auto-rows-min` — with a definite height from `flex-1`, the
    default `align-content: stretch` squashed all ten rows to fit instead of scrolling, which
    is what made the buttons unreachable. Verified at 320/375/390/414/768/844x390/1024/1440:
    dialog fits the viewport, grid scrolls, and the last Import button is both in-viewport
    and the real hit target at its centre, with no horizontal page scroll.
  - **Regression fixed — imported template dragged pre-existing nodes with it.**
    The first cut added imported nodes with `selected: true` without clearing the
    existing selection. React Flow drags every selected node as one unit, so if
    anything was already selected when the modal opened, the import joined that
    selection and dragging the template moved untouched pre-existing nodes too.
    Reproduced in a browser harness: 9 of 9 nodes selected after import, and
    dragging an imported node moved the pre-existing node by (83, 352). Now the
    change-set deselects everything first and imported nodes land unselected —
    0 selected after import, pre-existing node moves (0, 0). Node positions were
    asserted in flow coordinates, so React Flow's edge auto-pan cannot mask the result.
  - `components/editor/template-import.ts` (new): `importOffsetFor()` and
    `buildTemplateImportChanges()` extracted out of `canvas.tsx` (which was over
    600 lines) so the import change-set is unit-addressable without a live
    Liveblocks room. `canvas.tsx` now just calls the builder.
  - `tsc --noEmit` and `npm run build` pass. `eslint` reports only the pre-existing
    `react-hooks/set-state-in-effect` error in `share-dialog.tsx`.

## Open Questions

- Add unresolved product or implementation questions here.

## Architecture Decisions

- Dark-only: shadcn CSS variables are set once in `:root` with dark values; no light/dark split. The `dark` class is added to `<html>` as a belt-and-suspenders so shadcn's `.dark` selectors also resolve correctly.
- Tailwind v4 CSS-based config — no `tailwind.config.js`. Project tokens are defined as CSS custom properties in `globals.css` and mapped to Tailwind utilities via `@theme inline`.

## Completed

- Fix: dropped shapes landed below/right of the cursor
  - `components/editor/canvas.tsx` `handleDrop`: `screenToFlowPosition({ x: event.clientX, y: event.clientY })` already strips the canvas wrapper's bounding rect and undoes pan + zoom (`@xyflow/react` `screenToFlowPosition` subtracts `domNode.getBoundingClientRect()` then applies the renderer transform), so the cursor already maps to the correct flow coordinate. The drop placed the node's **top-left** there, which is why the body hung below/right of the pointer. The node now centers on that flow point by subtracting half its width/height:
    `position = { x: cursor.x - width/2, y: cursor.y - height/2 }`. The anchor is the native drop cursor (`event.clientX/Y`, i.e. the grab point), never the drag element's corner.
  - `components/editor/canvas.tsx` `handleDragStart`: computes the grab offset within the shape button (`event.clientX - rect.left`, `event.clientY - rect.top`) and passes it to `dataTransfer.setDragImage(element, offsetX, offsetY)` so the native drag image stays pinned to the grab point and the visual matches where the node will land. `DragGhost` remains centered on the cursor, consistent with the centered placement.
  - `screenToFlowPosition` is unchanged (already correct); this fix is purely correcting the node's top-left to center. `eslint` clean on `canvas.tsx` (only the pre-existing `share-dialog.tsx` effect error remains).

## Completed

- Project list row actions: inline icons + Share, plus presence/user fixes
  - `components/editor/project-sidebar.tsx`: the per-row three-dots `RowMenuPortal` is gone. Owned rows now render a compact inline `Share` (`Share2`), `Rename` (`Pencil`) and `Delete` (`Trash2`) ghost-icon set pinned at the far right, revealed on row hover / keyboard focus (`opacity-0 group-hover:opacity-100 focus-visible:opacity-100`). Actions unchanged — `openRename(project)` / `openDelete(project)` fire directly, and `Share` toggles the same `ShareDialog` used by the navbar (`projectId`/`projectName`/`ownedByCurrentUser` from `ProjectSummary`). Removed the now-unused `MoreHorizontal`, `createPortal`, `useEffect`, portal + menu components; `useState` still used by `InvitationRow`.
  - Drag responsiveness note: wrapping `CanvasNodeRenderer` / `CanvasEdgeComponent` in `React.memo` caused a runtime `"Component is not a function"` in this React Flow 12 + Turbopack combination (React Flow rejects the memoized wrapper as a node/edge type), so those were reverted to plain function exports. React Flow already renders per-node work through a memoized `NodeWrapper`, so the extra memo was redundant; drag smoothness is unchanged from the baseline. (`tsc --noEmit` clean; lint clean on touched files.)
  - `lib/collaborators.ts` + `app/api/liveblocks-auth/route.ts`: presence no longer reports real accounts as `Anonymous`.
  - Username-first identity + distinct per-user colors: the auth route's `userInfo.name` now prefers the Clerk **username** (`profile.username`), then display name, then email, then `Anonymous` — so an account with a username always shows it. Cursor/avatar color is no longer a collidable hash of the user id: `lib/cursor-colors.ts` (new) maps each Liveblocks `connectionId` (unique per active connection) to a 12-color palette via `cursorColorForConnection`, and `PresenceOverlay` + `CanvasCursor` use it — every concurrent editor's trail gets a distinct color. `getCursorColorForUser` remains only as the server-side `userInfo.color` fallback. `getUserProfileById` resolves the Clerk `username` and no longer bails just because an account lacks an email (returns `null` only when there is no email, username, or name at all), so collaborators on other screens see who is editing on the shared canvas.

## Session Notes

- `components/ui/*` must not be modified after installation per the spec.
- Project-specific token names: `bg-base`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.
