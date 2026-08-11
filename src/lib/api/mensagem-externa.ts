export type MensagemExterna = {
  id: number;
  origem: string;
  message: string;
  createdAt: string;
  status: "pending" | "ok";
};

export type MensagemExternaStatus = "pending" | "ok";

export const ALLOWED_STATUSES: MensagemExternaStatus[] = ["pending", "ok"];

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
    cache: "no-store",
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
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Upstream API returned ${response.status}: ${response.statusText}`,
    );
  }

  return (await response.json()) as MensagemExterna;
}

export async function updateMensagemExterna(
  id: number | string,
  data: { status: MensagemExternaStatus; message: string },
): Promise<MensagemExterna> {
  const baseUrl = process.env.LEONARDO_API_URL;

  if (!baseUrl) {
    throw new Error(
      "LEONARDO_API_URL environment variable is not set. Configure it in .env.local",
    );
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/afiliados/mensagem-externa/${id}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      `Upstream API returned ${response.status}: ${response.statusText}`,
    );
  }

  return (await response.json()) as MensagemExterna;
}

export async function deleteMensagemExterna(
  id: number | string,
): Promise<void> {
  const baseUrl = process.env.LEONARDO_API_URL;

  if (!baseUrl) {
    throw new Error(
      "LEONARDO_API_URL environment variable is not set. Configure it in .env.local",
    );
  }

  const url = `${baseUrl.replace(/\/+$/, "")}/afiliados/mensagem-externa/${id}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Upstream API returned ${response.status}: ${response.statusText}`,
    );
  }
}
