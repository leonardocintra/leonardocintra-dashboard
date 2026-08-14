import { revalidatePath } from "next/cache";

import {
  ALLOWED_STATUSES,
  deleteMensagemExterna,
  fetchMensagemExternaById,
  type MensagemExternaStatus,
  updateMensagemExterna,
} from "@/lib/api/mensagem-externa";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json(
      { error: "ID parameter is required" },
      { status: 400 },
    );
  }

  try {
    const message = await fetchMensagemExternaById(id);
    return Response.json(message, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("LEONARDO_API_URL environment variable is not set")) {
      return Response.json(
        { error: "Server configuration error: LEONARDO_API_URL is not set" },
        { status: 500 },
      );
    }

    if (message.includes("Upstream API returned 404")) {
      return Response.json(
        { error: `Message with id ${id} not found` },
        { status: 404 },
      );
    }

    if (message.includes("Upstream API")) {
      return Response.json(
        { error: "Failed to fetch message from upstream API" },
        { status: 502 },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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

  let body: { status?: string; message?: string; imageUrl?: string; imageName?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.status || body.message === undefined) {
    return Response.json(
      { error: "status and message fields are required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_STATUSES.includes(body.status as MensagemExternaStatus)) {
    return Response.json(
      { error: "Invalid status. Allowed values: pending, ok" },
      { status: 400 },
    );
  }

  try {
    const updated = await updateMensagemExterna(id, {
      status: body.status as MensagemExternaStatus,
      message: body.message,
      ...(body.imageUrl !== undefined && body.imageUrl !== ""
        ? { imageUrl: body.imageUrl }
        : {}),
      ...(body.imageName !== undefined && body.imageName !== ""
        ? { imageName: body.imageName }
        : {}),
    });
    revalidatePath("/dashboard");
    return Response.json(updated, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("LEONARDO_API_URL environment variable is not set")) {
      return Response.json(
        { error: "Server configuration error: LEONARDO_API_URL is not set" },
        { status: 500 },
      );
    }

    if (message.includes("Upstream API returned 404")) {
      return Response.json(
        { error: `Message with id ${id} not found` },
        { status: 404 },
      );
    }

    if (message.includes("Upstream API")) {
      return Response.json(
        { error: "Failed to update message on upstream API" },
        { status: 502 },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return Response.json(
      { error: "ID parameter is required" },
      { status: 400 },
    );
  }

  try {
    await deleteMensagemExterna(id);
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/mensagens", "page");
    return new Response(null, { status: 204 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("LEONARDO_API_URL environment variable is not set")) {
      return Response.json(
        { error: "Server configuration error: LEONARDO_API_URL is not set" },
        { status: 500 },
      );
    }

    if (message.includes("Upstream API returned 404")) {
      return Response.json(
        { error: `Message with id ${id} not found` },
        { status: 404 },
      );
    }

    if (message.includes("Upstream API")) {
      return Response.json(
        { error: "Failed to delete message on upstream API" },
        { status: 502 },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
