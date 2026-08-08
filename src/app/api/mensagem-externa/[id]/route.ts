import { fetchMensagemExternaById } from "@/lib/api/mensagem-externa";

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
