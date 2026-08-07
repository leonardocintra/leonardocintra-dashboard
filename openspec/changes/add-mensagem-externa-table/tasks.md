## 1. Docs & Environment Setup

- [x] 1.1 Read `node_modules/next/dist/docs/` for Next.js 16 route handler and server-side fetch conventions (per AGENTS.md) before writing any code
- [x] 1.2 Create `.env.example` at project root documenting `LEONARDO_API_URL` (server-only, no `NEXT_PUBLIC_` prefix) with a placeholder URL
- [x] 1.3 Create `.env.local` with `LEONARDO_API_URL=http://localhost:3005` for local development

## 2. shadcn Table Primitive

- [x] 2.1 Run `npx shadcn@latest add table` to install the `table` primitive into `src/components/ui/table.tsx`
- [x] 2.2 Verify `table.tsx` exports `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` and matches the base-luma style

## 3. Server-side Fetch Layer

- [x] 3.1 Create `src/lib/api/mensagem-externa.ts` exporting the `MensagemExterna` TypeScript type (`{ id: number; origem: string; message: string; createdAt: string; status: "pending" | "editing" }`)
- [x] 3.2 Implement a server-only `fetchMensagemExterna(status: "pending" | "editing"): Promise<MensagemExterna[]>` function that reads `process.env.LEONARDO_API_URL` and throws a clear error if unset
- [x] 3.3 Have `fetchMensagemExterna` call `{LEONARDO_API_URL}/afiliados/mensagem-externa?status=<status>` via Web `fetch` and parse the JSON array into the typed return

## 4. API Route Handler

- [x] 4.1 Create `src/app/api/mensagem-externa/route.ts` exposing a `GET` handler
- [x] 4.2 Validate the `status` query param: reject missing or non-`pending|editing` values with `400 Bad Request` and an explanatory message
- [x] 4.3 Call `fetchMensagemExterna(status)` and return the JSON array with `200 OK`
- [x] 4.4 Handle upstream failures: return `502 Bad Gateway` when the upstream is unreachable or non-2xx, and `500` when `LEONARDO_API_URL` is unset

## 5. MensagemExternaTable Component

- [x] 5.1 Create `src/components/mensagem-externa-table.tsx` as a Client Component (`"use client"`) accepting a `messages: MensagemExterna[]` prop
- [x] 5.2 Render a shadcn `<Table>` with header columns: ID, Origem, Status, Mensagem, Ações
- [x] 5.3 Render each message as a `<TableRow>` with the corresponding cells (id, origem, status, message)
- [x] 5.4 Truncate the Mensagem cell to 100 characters with an ellipsis (`slice(0, 100) + "…"`) only when the message exceeds 100 chars; show full text otherwise
- [x] 5.5 Add an Edit button in the Ações column for each row (can be a no-op `onClick` stub for now)
- [x] 5.6 Render an empty-state message ("Nenhuma mensagem encontrada") when the array is empty instead of table rows

## 6. Status Filter & Dashboard Page

- [x] 6.1 Create `src/app/dashboard/mensagens/page.tsx` as a Server Component that fetches initial data with `status=pending` server-side
- [x] 6.2 Add a status selector control (pending / editing) above the table that triggers a client-side `fetch("/api/mensagem-externa?status=<selected>")` on change
- [x] 6.3 State-manage the selected status and the fetched messages in the client portion of the page (or lift state into a small client wrapper) so toggling re-renders the table
- [x] 6.4 Render the `<MensagemExternaTable messages={...} />` component, keeping table rendering separate from page composition

## 7. Verification

- [x] 7.1 Run `npm run lint` (Biome) and ensure no errors on new files
- [x] 7.2 Run TypeScript type check (`npx tsc --noEmit`) and ensure no type errors
- [x] 7.3 Start `npm run dev`, navigate to `/dashboard/mensagens`, and verify the table renders with pending messages from the upstream API
- [x] 7.4 Toggle the status selector to `editing` and verify the table re-renders with editing messages
- [x] 7.5 Confirm the Mensagem column truncates to 100 chars with an ellipsis for long messages
- [x] 7.6 Confirm each row has an Edit button in the Ações column
