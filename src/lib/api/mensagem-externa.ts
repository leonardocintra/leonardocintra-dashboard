export type MensagemExterna = {
  id: number;
  origem: string;
  message: string;
  createdAt: string;
  status: "pending" | "editing";
};

export type MensagemExternaStatus = "pending" | "editing";

export const ALLOWED_STATUSES: MensagemExternaStatus[] = ["pending", "editing"];

export async function fetchMensagemExterna(
  status: MensagemExternaStatus,
): Promise<MensagemExterna[]> {
  const baseUrl = process.env.LEONARDO_API_URL;

  if (!baseUrl) {
    throw new Error(
      "LEONARDO_API_URL environment variable is not set. Configure it in .env.local",
    );
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/afiliados/mensagem-externa?status=${status}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `Upstream API returned ${response.status}: ${response.statusText}`,
    );
  }

  return (await response.json()) as MensagemExterna[];
}

export async function fetchMensagemExternaById(
  id: number | string,
): Promise<MensagemExterna> {
  const baseUrl = process.env.LEONARDO_API_URL;

  if (!baseUrl) {
    throw new Error(
      "LEONARDO_API_URL environment variable is not set. Configure it in .env.local",
    );
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/afiliados/mensagem-externa/${id}`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `Upstream API returned ${response.status}: ${response.statusText}`,
    );
  }

  return (await response.json()) as MensagemExterna;
}
