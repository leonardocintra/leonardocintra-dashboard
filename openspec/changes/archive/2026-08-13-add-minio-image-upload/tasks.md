## 1. Dependencies and Environment

- [x] 1.1 Install `minio` runtime dependency: `npm install minio`
- [x] 1.2 Install `@types/minio` dev dependency: `npm install --save-dev @types/minio`
- [x] 1.3 Add MinIO configuration entries to `.env.example` (after the existing `LEONARDO_API_URL` line): `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`, with placeholder values and explanatory comments (do NOT modify `.env`)

## 2. MinIO Client Module

- [x] 2.1 Create `src/lib/minio.ts` exporting a `getMinioClient()` function that reads all 6 `MINIO_*` env vars, throws a descriptive error listing the missing variable if any is unset, and returns a `Minio.Client` instance
- [x] 2.2 Implement singleton caching of the `Minio.Client` instance at module scope so repeated calls return the same instance

## 3. Image Upload API Route

- [x] 3.1 Create `src/app/api/mensagem-externa/[id]/upload/route.ts` exporting a `POST` handler with the same `params: Promise<{ id: string }>` signature used by the existing route
- [x] 3.2 Validate `id` presence (400 if missing)
- [x] 3.3 Write a helper `randomSuffix()` that generates 4 lowercase letters `[a-z]{4}` using `crypto.randomBytes` or `crypto.randomInt`
- [x] 3.4 Parse `request.formData()`, extract the `file` entry; return 400 ("file is required") if absent
- [x] 3.5 Validate `File.type` starts with `image/`; return 400 ("only image files are allowed") if not
- [x] 3.6 Optional size cap (e.g., 5 MB) — return 413 if exceeded
- [x] 3.7 Call `getMinioClient()`, convert the `File` to `Buffer` (`Buffer.from(await file.arrayBuffer())`), put the object into the bucket with key `{id}-{suffix}.{ext}` (ext derived from `File.name` or `File.type`)
- [x] 3.8 On MinIO env-missing error: 500 with message "MinIO environment is not configured"
- [x] 3.9 On MinIO upload error (non-2xx / network): 502 with message indicating upload failed
- [x] 3.10 On success: build `imageUrl` as `{protocol}://{endpoint}:{port}/{bucket}/{filename}` (protocol from `MINIO_USE_SSL`), return `200 OK` JSON `{ imageUrl: string }`

## 4. Type and API Layer Updates

- [x] 4.1 Add `imageUrl?: string` to the `MensagemExterna` type in `src/lib/api/mensagem-externa.ts`
- [x] 4.2 Update `updateMensagemExterna` signature to accept `imageUrl?: string` in its `data` parameter (`{ status, message, imageUrl? }`)
- [x] 4.3 Update the upstream PATCH body construction to include `imageUrl` only when present and non-empty (omit empty string)

## 5. PATCH Handler Updates

- [x] 5.1 Update the body type in `PATCH` (`src/app/api/mensagem-externa/[id]/route.ts`) to include optional `imageUrl?: string`
- [x] 5.2 Pass `imageUrl` through to `updateMensagemExterna` only when present and non-empty (empty string treated as absent)

## 6. Frontend Form

- [x] 6.1 Add an `<input type="file" accept="image/*">` (labeled, e.g., "Imagem") to the form's `CardContent` in `src/app/dashboard/mensagens/[id]/mensagem-form.tsx`, using shadcn primitives already in the project (Label, either Input or native styled input) — keep consistent with existing layout (grid / spacing)
- [x] 6.2 Add state: `imageFile: File | null`, `imageUrl: string | null`, `uploading: boolean`, `uploadError: string | null`
- [x] 6.3 On file change: set `imageFile`, immediately POST the file to `/api/mensagem-externa/[id]/upload` as `multipart/form-data`, assign response `imageUrl` on success or set `uploadError` on failure
- [x] 6.4 Show preview of the selected image and/or a small spinner while uploading; show `uploadError` text under the input if upload fails
- [x] 6.5 In `handleSave`: if `imageUrl` is set (and non-empty), include `imageUrl` in the PATCH body; if upload failed, do not proceed with PATCH and surface the error
- [x] 6.6 Submit the PATCH body as `{ status, message, imageUrl }` (or without `imageUrl` when no image selected) — keep the existing fetch call shape in `handleSave`

## 7. Validation

- [x] 7.1 Run `npx tsc --noEmit` to verify no type errors across changed files (`src/lib/minio.ts`, `src/lib/api/mensagem-externa.ts`, `src/app/api/mensagem-externa/[id]/route.ts`, `src/app/api/mensagem-externa/[id]/upload/route.ts`, `src/app/dashboard/mensagens/[id]/mensagem-form.tsx`) — verified 2026-08-13: exit 0
- [x] 7.2 Run `npm run build` (or `npm run lint` if build is unavailable) and ensure exit code 0 — verified 2026-08-13: Next.js 16.3.0 Turbopack build succeeded
- [ ] 7.3 Manually verify with a local MinIO instance: upload an image via the form, confirm `imageUrl` is returned, and PATCH saves successfully with `imageUrl` populated
- [ ] 7.4 Verify the "no image" path: save a message without selecting an image — PATCH succeeds without `imageUrl`
