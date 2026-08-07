## Why

The dashboard currently has no way to visualize external messages (`mensagem-externa`) coming from the Leonardo API. Users need to browse, filter by status, and take actions on these messages — all from a dedicated table view inside the dashboard. Today this is only possible via direct API/Postman calls, which is not sustainable for day-to-day operations.

## What Changes

- Add a new **Next.js API route** (`src/app/api/mensagem-externa/route.ts`) that proxies requests to the upstream Leonardo API (`{LEONARDO_API_URL}/afiliados/mensagem-externa`) with a `status` query filter (`pending` | `editing`).
- Add a new **server-side fetch layer** under `src/lib/api/` to centralize calls to the Leonardo API and keep the API URL behind the server (never exposed to the client).
- Add a **shadcn `table` UI primitive** (not yet installed in the project) so we can build data tables following the existing base-luma shadcn style.
- Add a new **reusable `MensagemExternaTable` component** that renders the messages in a table with columns: ID, Origem, Status, Mensagem (truncated to 100 chars), and an Actions column with an Edit button.
- Add a **status filter** (pending / editing) control above the table so the user can switch which status to fetch.
- Add a **new dashboard page** at `src/app/dashboard/mensagens/page.tsx` that renders the table component, keeping page and table logic separate.
- Add a **`.env.local` example** documenting the `LEONARDO_API_URL` environment variable for the production API base URL.

## Capabilities

### New Capabilities
- `mensagem-externa-table`: Server-side data table for listing, filtering by status, and acting on external messages from the Leonardo API, including an API route layer, reusable table component, and dashboard page.

### Modified Capabilities
<!-- No existing specs to modify. openspec/specs/ is currently empty. -->

## Impact

- **New files**: `src/app/api/mensagem-externa/route.ts`, `src/lib/api/mensagem-externa.ts`, `src/components/mensagem-externa-table.tsx`, `src/components/ui/table.tsx` (shadcn primitive), `src/app/dashboard/mensagens/page.tsx`.
- **Env vars**: Introduces `LEONARDO_API_URL` (server-only — no `NEXT_PUBLIC_` prefix) pointing to the upstream API base URL.
- **Dependencies**: May need `@tanstack/react-table` if the table requires advanced features (sorting/pagination); minimal version for column rendering + truncation is sufficient without it.
- **Routing**: Adds `/dashboard/mensagens` route and `/api/mensagem-externa` route to the Next.js app router.
- **No breaking changes** — all additions are additive.
