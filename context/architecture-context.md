# Architecture Context

## Stack

| Layer            | Technology              | Role                                                           |
| ---------------- | ----------------------- | -------------------------------------------------------------- |
| Framework        | Next.js 16 + TypeScript | Full-stack app with server/client boundaries                   |
| UI               | Tailwind + shadcn/ui    | Component composition and styling                              |
| Auth             | Clerk                   | User identity and route protection                             |
| Database         | Prisma + PostgreSQL     | Relational metadata: projects, collaborators, specs, task runs |
| Canvas           | Liveblocks + React Flow | Real-time collaborative canvas, presence, and cursors          |
| Background tasks | Trigger.dev             | Durable AI generation workflows                                |
| Artifact storage | Vercel Blob             | Canvas snapshots and generated Markdown specs                  |

## System Boundaries

- `app/api` — Authenticated request handlers: input validation, ownership checks, task triggering, and persistence.
- `trigger` — Long-running background jobs: AI design generation and spec generation.
- `lib` — Shared infrastructure: Prisma client, access control helpers, and utilities.
- `components` — UI composition: canvas surfaces, sidebars, dialogs, and interactive elements.
- `prisma` — Database schema and generated client output.
- `data` — Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships, and task run records.
- **Vercel Blob**: generated artifacts — canvas snapshots at `canvas/{projectId}.json` and specs at `specs/{projectId}/{specId}.md`.
- Project records, spec records, and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additional collaborators.
- Only authenticated users can access protected routes.
- Only the owner or a collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.
- Membership and edit rights are separate: `ProjectCollaborator.canEdit` (default
  `false`) decides whether a collaborator may mutate the canvas. Owners always
  can. The owner chooses view or edit when sending an invite, and can change it
  afterwards.
- Edit rights are enforced in the Liveblocks room grant, not just the UI:
  editors get `room:write`, viewers get `room:read` + `room:presence:write`, so
  a viewer keeps live cursors but the server rejects storage mutations.
- Changing `canEdit` re-syncs the room grant immediately, so a revoked
  collaborator loses write access on their current connection rather than at
  token expiry.
- `canShare` (invite rights) and `canEdit` (mutation rights) are independent
  flags; a collaborator with share rights can only ever invite view-only users.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import is additive: an imported template is offset to sit clear of existing
  content and never replaces or deletes what is already on the canvas.
- An import leaves the canvas selection empty. React Flow moves every selected
  node together, so a shared selection between imported and pre-existing nodes
  would make unrelated elements drag as one unit.
- Import can occur on canvas creation or from within the editor at any time.
- Importing requires edit rights; the Templates entry point is hidden from viewers.
- Template data follows the same node/edge schema as user-created canvas content.
- Templates do not require a separate database record; they are resolved by template ID at import time.

## AI Generation Model

### Design Generation

- Input: user prompt, project context, and current canvas state.
- Execution: durable background task via Trigger.dev.
- Output: structured node and edge updates written into the shared Liveblocks room.

### Spec Generation

- Input: current canvas graph and project context.
- Execution: durable background task via Trigger.dev.
- Output: Markdown technical spec saved to the filesystem and linked to the project in the database.

## Invariants

1. Request handlers do not run long-lived AI work — that belongs in background tasks.
2. Metadata and large generated artifacts are stored in separate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.
6. Canvas mutations require edit rights, enforced server-side by the Liveblocks
   room grant; client-side gating is a UX affordance, never the security boundary.
7. Importing a template never destroys existing canvas content.
8. The editor workspace requires a viewport of at least 1024px; below that it is
   blocked outright rather than degraded.
