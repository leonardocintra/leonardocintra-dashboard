## ADDED Requirements

### Requirement: MinIO server-side client module
The system SHALL provide a server-only module at `src/lib/minio.ts` that exports a `getMinioClient()` function returning a configured `Minio.Client` instance, reading connection parameters from environment variables `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, and `MINIO_BUCKET`.

#### Scenario: Client initialized from env
- **WHEN** `getMinioClient()` is called and all six `MINIO_*` environment variables are set
- **THEN** the function returns a `Minio.Client` instance configured with `endPoint=MINIO_ENDPOINT`, `port=MINIO_PORT`, `useSSL=MINIO_USE_SSL`, `accessKey=MINIO_ACCESS_KEY`, `secretKey=MINIO_SECRET_KEY`

#### Scenario: Missing env var
- **WHEN** any of the six `MINIO_*` environment variables is unset and `getMinioClient()` is invoked
- **THEN** the function throws an error whose message names the missing variable

#### Scenario: Singleton instance
- **WHEN** `getMinioClient()` is called multiple times within the same process
- **THEN** the function returns the same cached `Minio.Client` instance rather than creating a new one on each call

### Requirement: MinIO environment variables documented
The system SHALL document the six MinIO configuration variables (`MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`) in a `.env.example` file at the project root with placeholder values, alongside the existing `LEONARDO_API_URL` entry.

#### Scenario: Example file contains all MinIO variables
- **WHEN** a developer inspects the `.env.example` file
- **THEN** it contains entries for `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, and `MINIO_BUCKET` with placeholder values

#### Scenario: Server-only variables
- **WHEN** the `.env.example` documents the `MINIO_*` variables
- **THEN** none of the variable names start with `NEXT_PUBLIC_`, ensuring credentials stay server-only

#### Scenario: Existing LEONARDO_API_URL preserved
- **WHEN** a developer inspects the `.env.example` file after the change
- **THEN** the existing `LEONARDO_API_URL` entry is still present and unchanged

### Requirement: Image upload route
The system SHALL expose a Next.js route handler at `POST /api/mensagem-externa/[id]/upload` that accepts a `multipart/form-data` request containing a single image file, uploads it to the configured MinIO bucket with a generated filename, and returns the public URL of the uploaded image.

#### Scenario: Successful upload
- **WHEN** a `POST /api/mensagem-externa/[id]/upload` request is sent with a valid image file in the `multipart/form-data` body
- **THEN** the system uploads the file to the MinIO bucket and returns `200 OK` with a JSON body `{ imageUrl: string }` containing the public URL

#### Scenario: Filename format
- **WHEN** an image is uploaded for a message with `id=1500`
- **THEN** the generated filename matches the pattern `{id}-{4-letters}.{ext}` (e.g., `1500-abcd.png`), where `{id}` is the path parameter and `{4-letters}` is a random lowercase alphabetic suffix

#### Scenario: URL format
- **WHEN** an image is uploaded successfully
- **THEN** the returned `imageUrl` follows the format `{protocol}://{endpoint}:{port}/{bucket}/{filename}` where `protocol` is `http` or `https` based on `MINIO_USE_SSL`

#### Scenario: Missing id parameter
- **WHEN** a request is made to `POST /api/mensagem-externa//upload` (no id in path)
- **THEN** the system returns `400 Bad Request` with an error message indicating the id is required

#### Scenario: No file in request
- **WHEN** a `POST /api/mensagem-externa/[id]/upload` request is sent without a file in the `multipart/form-data` body
- **THEN** the system returns `400 Bad Request` with an error message indicating the file is required

#### Scenario: Non-image file type
- **WHEN** the uploaded file's MIME type does not start with `image/`
- **THEN** the system returns `400 Bad Request` with an error message indicating only image files are allowed

#### Scenario: MinIO env not configured
- **WHEN** any `MINIO_*` environment variable is unset and a request hits the upload route
- **THEN** the system returns `500 Internal Server Error` with a message indicating the MinIO environment is not configured

#### Scenario: MinIO unreachable
- **WHEN** the MinIO server is unreachable or returns a non-2xx status during upload
- **THEN** the system returns `502 Bad Gateway` with an error message indicating the upload to MinIO failed

### Requirement: PATCH handler accepts optional imageUrl
The system SHALL modify the `PATCH /api/mensagem-externa/[id]` route handler to accept an optional `imageUrl` field in the request body. When `imageUrl` is present, the system SHALL include it in the payload forwarded to the upstream Leonardo API.

#### Scenario: PATCH with imageUrl
- **WHEN** a `PATCH /api/mensagem-externa/[id]` request is sent with body `{ status, message, imageUrl }`
- **THEN** the system forwards `imageUrl` alongside `status` and `message` to the upstream API

#### Scenario: PATCH without imageUrl
- **WHEN** a `PATCH /api/mensagem-externa/[id]` request is sent with body `{ status, message }` and no `imageUrl` field
- **THEN** the system forwards the request to the upstream API without `imageUrl` (image is not required)

#### Scenario: imageUrl empty string treated as absent
- **WHEN** a `PATCH /api/mensagem-externa/[id]` request body contains `imageUrl: ""`
- **THEN** the system omits `imageUrl` from the forwarded payload (an empty string is treated as no image)

### Requirement: updateMensagemExterna accepts optional imageUrl
The system SHALL update the `updateMensagemExterna` function in `src/lib/api/mensagem-externa.ts` to accept an optional `imageUrl?: string` in its `data` parameter and include it in the JSON body sent to the upstream API when present.

#### Scenario: Function called with imageUrl
- **WHEN** `updateMensagemExterna(id, { status, message, imageUrl })` is called with a non-empty `imageUrl`
- **THEN** the upstream PATCH request body contains `imageUrl` as a field

#### Scenario: Function called without imageUrl
- **WHEN** `updateMensagemExterna(id, { status, message })` is called without `imageUrl`
- **THEN** the upstream PATCH request body does not contain the `imageUrl` field

### Requirement: MensagemExterna type includes optional imageUrl
The system SHALL add an optional `imageUrl?: string` field to the `MensagemExterna` type in `src/lib/api/mensagem-externa.ts` to represent the URL of an image stored in MinIO, if present.

#### Scenario: Type accepts imageUrl
- **WHEN** a `MensagemExterna` object is constructed with `imageUrl: "http://..."`
- **THEN** the TypeScript compiler accepts the object without error

#### Scenario: Type works without imageUrl
- **WHEN** a `MensagemExterna` object is constructed without the `imageUrl` field
- **THEN** the TypeScript compiler accepts the object without error (the field is optional)

### Requirement: Image upload input in mensagem form
The system SHALL add an optional image input to the form at `src/app/dashboard/mensagens/[id]/mensagem-form.tsx` that allows the user to select a single image file, triggers an upload to `POST /api/mensagem-externa/[id]/upload` when an image is selected, and sends the returned `imageUrl` in the subsequent `PATCH` request.

#### Scenario: Image input visible
- **WHEN** the form renders
- **THEN** an `<input type="file" accept="image/*">` element is present, labeled appropriately for the user to select an image

#### Scenario: Image not required
- **WHEN** the user clicks "Salvar" without selecting an image
- **THEN** the form submits the `PATCH` request without `imageUrl` (no image field) and the save succeeds

#### Scenario: Image selected triggers upload
- **WHEN** the user selects an image file in the input
- **THEN** the form uploads the file to `POST /api/mensagem-externa/[id]/upload`, receives `{ imageUrl }` in the response, and stores the imageUrl for the subsequent save

#### Scenario: Save with uploaded image
- **WHEN** the user has selected an image (upload succeeded) and clicks "Salvar"
- **THEN** the `PATCH` request body includes the `imageUrl` returned from the upload

#### Scenario: Upload failure blocks save
- **WHEN** the image upload fails (non-2xx) and the user clicks "Salvar"
- **THEN** the form does not proceed with the PATCH (or omits `imageUrl`), and surfaces an error message to the user indicating the upload failed
