import type { NextRequest } from "next/server";

import {
  ALLOWED_STATUSES,
  fetchMensagemExterna,
  type MensagemExternaStatus,
} from "@/lib/api/mensagem-externa";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status");

  if (!status) {
    return Response.json(
      { error: "Status parameter is required" },
      { status: 400 },
    );
  }

  if (!ALLOWED_STATUSES.includes(status as MensagemExternaStatus)) {
    return Response.json(
      { error: "Invalid status. Allowed values: pending, editing" },
      { status: 400 },
    );
  }

  try {
    const messages = await fetchMensagemExterna(
      status as MensagemExternaStatus,
    );
    return Response.json(messages, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("LEONARDO_API_URL environment variable is not set")) {
      return Response.json(
        { error: "Server configuration error: LEONARDO_API_URL is not set" },
        { status: 500 },
      );
    }

    if (message.includes("Upstream API")) {
      return Response.json(
        { error: "Failed to fetch messages from upstream API" },
        { status: 502 },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
