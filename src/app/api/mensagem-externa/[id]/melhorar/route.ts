import { improveMensagemExterna } from "@/lib/api/mensagem-externa";

export async function POST(request: Request) {
  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body.message !== "string" || body.message.trim() === "") {
    return Response.json(
      { error: "message field is required and must be a non-empty string" },
      { status: 400 },
    );
  }

  try {
    const improved = await improveMensagemExterna(body.message);
    return Response.json({ message: improved }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("LEONARDO_API_URL environment variable is not set")) {
      return Response.json(
        { error: "Server configuration error: LEONARDO_API_URL is not set" },
        { status: 500 },
      );
    }

    if (message.includes("Upstream API timed out")) {
      return Response.json(
        { error: "A IA demorou demais para responder. Tente novamente." },
        { status: 504 },
      );
    }

    if (message.includes("Upstream API")) {
      return Response.json(
        { error: "Não foi possível melhorar a mensagem. Tente novamente." },
        { status: 502 },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
