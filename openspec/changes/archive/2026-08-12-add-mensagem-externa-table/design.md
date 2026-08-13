## Context

The dashboard is a Next.js 16 (App Router) + React 19 project using shadcn (base-luma style, stone base color) with Tailwind v4 and Biome. It currently has a login page and a nearly empty dashboard with a sidebar shell. The `src/components/ui/` folder has 11 shadcn primitives but no `table` primitive yet. There is no `/api` route layer and no server-side data-fetching utilities — all API calls must be created from scratch.

The upstream Leonardo API serves external messages at `GET {LEONARDO_API_URL}/afiliados/mensagem-externa?status=<pending|editing>`, returning an array of `{ id, origem, message, createdAt, status }`. The API URL must be stored as a server-only env var (`LEONARDO_API_URL`) and never shipped to the client.

Next.js 16 guidance (per `AGENTS.md`) mandates reading `node_modules/next/dist/docs/` for route handlers and data-fetching conventions before writing code, since this version may differ from prior training.

## Goals / Non-Goals

**Goals:**
- Proxy upstream `mensagem-externa` calls through a Next.js route handler so the `LEONARDO_API_URL` stays server-only.
- Render a reusable, page-agnostic `<MensagemExternaTable />` component with columns ID, Origem, Status, Mensagem (truncated to 100 chars), and an Edit action button.
- Provide a status selector (pending / editing) that drives which messages the table displays.
- Add a dedicated dashboard page (`/dashboard/mensagens`) that wires the status filter + table together, keeping page composition and table rendering separate.
- Introduce the shadcn `table` primitive so future tables can reuse it.

**Non-Goals:**
- Full CRUD on messages — only listing + an Edit button (wired to a no-op/handler stub for now; edit flow is out of scope).
- Client-side sorting, pagination, or virtualization of the table (may be added later).
- Authentication/authorization on the new API route (authorization design is separate).
- Modifying the existing login page or sidebar.

## Decisions

### Decision 1: Next.js Route Handler as API proxy
Use a route handler at `src/app/api/mensagem-externa/route.ts` (App Router convention) that accepts a `status` query param, validates it against the `pending|editing` allowlist, and proxies to `{LEONARDO_API_URL}/afiliados/mensagem-externa?status=<status>` using the Web `fetch` API.

**Why over calling the upstream directly from the client:** keeps `LEONARDO_API_URL` server-only, avoids CORS, and gives a single seam to add auth/rate-limiting later.

**Alternatives considered:**
- Direct client fetch to upstream — rejected: leaks the API URL and requires CORS on the upstream.
- Server Action — rejected: this is a read query that benefits from being a cacheable GET route, not a mutation.

### Decision 2: Server-only fetch layer in `src/lib/api/`
Centralize the upstream call in `src/lib/api/mensagem-externa.ts` exporting a typed `fetchMensagemExterna(status): Promise<MensagemExterna[]>` helper with a `MensagemExterna` TypeScript type (`{ id: number; origem: string; message: string; createdAt: string; status: "pending" | "editing" }`). The route handler imports this; the page imports it via the route (not directly) to keep one entry point.

**Why:** type safety, easy to mock in tests, and a single place that reads `process.env.LEONARDO_API_URL`.

### Decision 3: shadcn `table` primitive (install first)
The project uses `shadcn` CLI with `components.json` (style `base-luma`, alias `@/components/ui`). We add `table.tsx` to `src/components/ui/` via `npx shadcn@latest add table`. This primitive composes `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>` — enough to build the messages table without any extra dependency.

**Alternatives considered:**
- `@tanstack/react-table` — rejected for now: only column rendering + truncation is needed; revisit if sorting/pagination is requested.
- Hand-rolled `<table>` — rejected: would diverge from shadcn styling conventions already in the project.

### Decision 4: Client-side table component, server-side data fetch
The page at `src/app/dashboard/mensagens/page.tsx` is a **Server Component** that fetches initial data by calling the internal `/api/mensagem-externa` route (or directly via the lib helper, since the page is server-side). The `<MensagemExternaTable />` component is a **Client Component** (`"use client"`) because it owns the status-selector state and triggers refetches when the user toggles status.

Data flow:
```
Dashboard page (RSC) ──► /api/mensagem-externa?status=…
                              │
                              ▼
                       src/lib/api/mensagem-externa.ts
                              │
                              ▼
                       {LEONARDO_API_URL}/afiliados/mensagem-externa
```

For status changes after initial render, the client component calls the same internal route via `fetch("/api/mensagem-externa?status=editing")`.

### Decision 5: Message truncation to 100 characters
Truncate `message` to 100 chars (CSS `line-clamp` or JS `slice(0, 100) + "…"`). Use JS truncation so the 100-char limit is exact and deterministic regardless of viewport; CSS `line-clamp` alone depends on container width. A tooltip/title attribute can reveal the full message on hover (nice-to-have).

### Decision 6: `LEONARDO_API_URL` env var
- Add `LEONARDO_API_URL` to `.env.local` (server-only — no `NEXT_PUBLIC_` prefix per Next.js conventions).
- Provide `.env.example` documenting it (this file is NOT gitignored — only `.env*` patterns are).
- The lib helper reads `process.env.LEONARDO_API_URL` and throws a clear error at request time if it's missing, rather than crashing at module load.

## Risks / Trade-offs

- **Upstream API shape changes** → We define a `MensagemExterna` type that mirrors the documented payload; if the upstream adds/removes fields, the type needs updating. Mitigation: keep the type minimal (only fields we render) and log/ignore unknown fields.
- **`LEONARDO_API_URL` unset in production** → Requests fail at runtime. Mitigation: clear error message pointing to the env var; document in `.env.example`.
- **No auth on the proxy route** → Anyone hitting `/api/mensagem-externa` can read messages. Mitigation: acceptable for an internal dashboard behind login; add auth middleware in a follow-up.
- **Client refetch on status toggle** → Adds a round-trip per toggle. Trade-off: simpler than maintaining client-side cache; acceptable given low volume.
- **Next.js 16 specifics** → Per `AGENTS.md`, must read `node_modules/next/dist/docs/` for route handler + fetch conventions before implementing. Mitigation: tasks.md includes a step to read the docs first.
