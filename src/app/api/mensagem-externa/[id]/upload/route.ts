import { randomBytes } from "node:crypto";

import { getMinioClient, getMinioConfig } from "@/lib/minio";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

const MIME_TO_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
};

function randomSuffix(): string {
  const bytes = randomBytes(4);
  let out = "";
  for (let i = 0; i < 4; i++) {
    // biome-ignore lint/suspicious/noBitwiseOperators: bitwise is fine here, byte -> 0..25
    out += String.fromCharCode(97 + (bytes[i]! % 26));
  }
  return out;
}

function extensionFor(file: File): string {
  const fromName = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".") + 1).toLowerCase()
    : null;
  if (fromName && /^[a-z0-9]{1,8}$/.test(fromName)) {
    return fromName;
  }
  return MIME_TO_EXT[file.type] ?? "bin";
}

function isMinioConfigError(message: string): boolean {
  return message.includes("MinIO environment is not configured");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json(
      { error: "ID parameter is required" },
      { status: 400 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Invalid multipart/form-data body" },
      { status: 400 },
    );
  }

  const fileEntry = formData.get("file");
  if (!(fileEntry instanceof File)) {
    return Response.json({ error: "file is required" }, { status: 400 });
  }

  if (!fileEntry.type.startsWith("image/")) {
    return Response.json(
      { error: "only image files are allowed" },
      { status: 400 },
    );
  }

  if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
    return Response.json(
      { error: `file exceeds maximum size of ${MAX_FILE_SIZE_BYTES} bytes` },
      { status: 413 },
    );
  }

  let client;
  try {
    client = getMinioClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (isMinioConfigError(message)) {
      return Response.json(
        { error: "MinIO environment is not configured" },
        { status: 500 },
      );
    }
    console.error("Failed to initialize MinIO client:", message);
    return Response.json(
      { error: "Failed to initialize MinIO client" },
      { status: 500 },
    );
  }

  const config = getMinioConfig();
  const suffix = randomSuffix();
  const ext = extensionFor(fileEntry);
  const filename = `${id}-${suffix}.${ext}`;

  const buffer = Buffer.from(await fileEntry.arrayBuffer());

  try {
    await client.putObject(config.bucket, filename, buffer, buffer.length, {
      "Content-Type": fileEntry.type,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(
      { error: `upload to MinIO failed: ${message}` },
      { status: 502 },
    );
  }

  const protocol = config.useSSL ? "https" : "http";
  const imageUrl = `${protocol}://${config.endPoint}:${config.port}/${config.bucket}/${filename}`;
  const imageName = filename;

  return Response.json({ imageUrl, imageName }, { status: 201 });
}
