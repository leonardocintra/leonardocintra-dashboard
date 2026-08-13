# Capability: mensagem-externa-table

## Purpose

TBD

## Requirements

### Requirement: API route proxies external messages
The system SHALL expose a Next.js route handler at `GET /api/mensagem-externa` that accepts a `status` query parameter and returns the JSON array of external messages from the upstream Leonardo API.

#### Scenario: Fetch pending messages
- **WHEN** a request is made to `GET /api/mensagem-externa?status=pending`
- **THEN** the system proxies to `{LEONARDO_API_URL}/afiliados/mensagem-externa?status=pending` and returns the JSON array with `200 OK`

#### Scenario: Fetch editing messages
- **WHEN** a request is made to `GET /api/mensagem-externa?status=editing`
- **THEN** the system proxies to `{LEONARDO_API_URL}/afiliados/mensagem-externa?status=editing` and returns the JSON array with `200 OK`

#### Scenario: Missing status parameter
- **WHEN** a request is made to `GET /api/mensagem-externa` without a `status` query parameter
- **THEN** the system returns `400 Bad Request` with an error message indicating `status` is required

#### Scenario: Invalid status value
- **WHEN** a request is made with a `status` value other than `pending` or `editing`
- **THEN** the system returns `400 Bad Request` with an error message listing allowed values

#### Scenario: Upstream API unreachable
- **WHEN** the upstream Leonardo API is unreachable or returns a non-2xx status
- **THEN** the system returns `502 Bad Gateway` with an error message indicating the upstream call failed

#### Scenario: LEONARDO_API_URL not configured
- **WHEN** the `LEONARDO_API_URL` environment variable is not set and a request hits the route
- **THEN** the system returns `500 Internal Server Error` with a message indicating the env var is missing

### Requirement: Server-side fetch layer for messages
The system SHALL provide a server-only module at `src/lib/api/mensagem-externa.ts` exposing a typed `fetchMensagemExterna(status)` function that reads `LEONARDO_API_URL` from the environment and returns an array of `MensagemExterna` objects.

#### Scenario: Typed return shape
- **WHEN** `fetchMensagemExterna("pending")` is called and the upstream responds with the documented payload
- **THEN** the function returns `Promise<MensagemExterna[]>` where each item has `id: number`, `origem: string`, `message: string`, `createdAt: string`, `status: "pending" | "editing"`

#### Scenario: Missing env var at call time
- **WHEN** `LEONARDO_API_URL` is unset and `fetchMensagemExterna` is invoked
- **THEN** the function throws an error whose message names `LEONARDO_API_URL` as the missing variable

### Requirement: shadcn table primitive available
The system SHALL include the shadcn `table` primitive at `src/components/ui/table.tsx` exporting `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, and `TableCell` components styled consistently with the existing base-luma shadcn theme.

#### Scenario: Table renders rows
- **WHEN** a `<Table>` is composed with `TableHeader`/`TableBody` and rows
- **THEN** the rendered DOM is a styled `<table>` matching the project's Tailwind/shadcn conventions

### Requirement: Reusable MensagemExternaTable component
The system SHALL provide a reusable client component at `src/components/mensagem-externa-table.tsx` that renders external messages in a table with columns ID, Origem, Status, Mensagem, and Ações.

#### Scenario: Renders all columns
- **WHEN** the component receives a non-empty array of messages
- **THEN** it renders a table with header columns: ID, Origem, Status, Mensagem, Ações (in that order)

#### Scenario: Message column truncated to 100 characters
- **WHEN** a message's `message` field is longer than 100 characters
- **THEN** the Mensagem column displays only the first 100 characters of the message followed by an ellipsis (`…`)

#### Scenario: Message under 100 characters
- **WHEN** a message's `message` field is 100 characters or fewer
- **THEN** the Mensagem column displays the full message without truncation or ellipsis

#### Scenario: Edit action button present
- **WHEN** the table renders a row
- **THEN** the last column (Ações) contains an Edit button for that row

#### Scenario: Empty state
- **WHEN** the component receives an empty array of messages
- **THEN** it renders an empty-state message (e.g., "Nenhuma mensagem encontrada") instead of table rows

### Requirement: Status filter control
The system SHALL expose a status selector allowing the user to switch between `pending` and `editing` status, which drives which messages are fetched and rendered.

#### Scenario: Default status
- **WHEN** the page loads for the first time
- **THEN** the status selector defaults to `pending` and the table renders pending messages

#### Scenario: Switch to editing
- **WHEN** the user selects `editing` in the status selector
- **THEN** the system fetches messages with `status=editing` and the table re-renders with the new data

#### Scenario: Only allowed values
- **WHEN** the status selector is rendered
- **THEN** it offers exactly two options: `pending` and `editing`

### Requirement: Dashboard page wires table and filter
The system SHALL provide a dashboard page at `/dashboard/mensagens` that composes the status filter and the `MensagemExternaTable` component, keeping page composition logic separate from the table component's internal rendering.

#### Scenario: Page renders the table
- **WHEN** a user navigates to `/dashboard/mensagens`
- **THEN** the page renders the status selector and the `MensagemExternaTable` component populated with initial data fetched server-side

#### Scenario: Table component is reusable
- **WHEN** the `MensagemExternaTable` component is imported by any page
- **THEN** it renders independently of page-specific code, accepting messages as props

### Requirement: LEONARDO_API_URL environment variable documented
The system SHALL document the `LEONARDO_API_URL` environment variable in a `.env.example` file at the project root, with a production API base URL placeholder, so developers know which variable to set.

#### Scenario: Example file exists
- **WHEN** a developer inspects the project root
- **THEN** a `.env.example` file exists containing a commented `LEONARDO_API_URL=<placeholder>` entry

#### Scenario: Server-only variable
- **WHEN** the `.env.example` documents `LEONARDO_API_URL`
- **THEN** the variable name does NOT start with `NEXT_PUBLIC_`, ensuring it stays server-only
