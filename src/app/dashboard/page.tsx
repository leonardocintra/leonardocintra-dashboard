import type { MensagemExterna } from "@/lib/api/mensagem-externa";
import { fetchMensagemExterna } from "@/lib/api/mensagem-externa";

import { MensagensClientView } from "./mensagens-client-view";

export default async function DashboardHome() {
  let messages: MensagemExterna[] = [];

  try {
    messages = await fetchMensagemExterna("pending");
  } catch {
    // Graceful degradation: render empty table if upstream is down
    messages = [];
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold tracking-tight">Mensagens Externas</h1>
      <MensagensClientView initialMessages={messages} />
    </div>
  );
}
