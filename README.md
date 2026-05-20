# emedit-AI

A real-time collaborative system design workspace. Describe a system in plain English, let an AI agent map it onto a shared canvas, refine the architecture with collaborators, and generate a technical specification from the resulting graph.


## Features

- **Auth & projects** — sign-in, route protection, project ownership, and collaborator access.
- **Collaborative canvas** — shared real-time editing via Liveblocks + React Flow with live cursors and presence.
- **Starter templates** — curated library of system design patterns (monolith, microservices, event-driven, serverless) importable into the canvas.
- **AI architecture generation** — natural-language prompt → nodes and edges drawn on the canvas.
- **Spec generation** — convert the final graph into a persistent Markdown technical spec.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Realtime:** Liveblocks
- **Canvas:** React Flow
- **Auth & storage:** Supabase
- **Styling:** Tailwind CSS

## Getting Started

```bash
# install
pnpm install   # or npm / yarn / bun

# run dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `LIVEBLOCKS_SECRET_KEY`

## Project Structure

```
app/             # Next.js App Router routes
context/         # Product, architecture, UI, and workflow docs (read these first)
components/      # Shared UI
lib/             # Utilities and integrations
```

See [`context/`](./context) for the source-of-truth project overview, architecture, UI conventions, and progress tracker.

## Deploy

Deploys on [Vercel](https://vercel.com/new). Set the env vars above in the project settings before the first build.

## License

© EmeditWeb. All rights reserved.
