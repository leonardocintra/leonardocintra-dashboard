"use client";

import { useCallback, useState } from "react";

import { MensagemExternaTable } from "@/components/mensagem-externa-table";
import type {
  MensagemExterna,
  MensagemExternaStatus,
} from "@/lib/api/mensagem-externa";

export function MensagensClientView({
  initialMessages,
}: {
  initialMessages: MensagemExterna[];
}) {
  const [status, setStatus] = useState<MensagemExternaStatus>("pending");
  const [messages, setMessages] = useState<MensagemExterna[]>(initialMessages);
  const [loading, setLoading] = useState(false);

  const handleStatusChange = useCallback(
    async (newStatus: MensagemExternaStatus) => {
      setStatus(newStatus);
      setLoading(true);
      try {
        const res = await fetch(`/api/mensagem-externa?status=${newStatus}`);
        if (res.ok) {
          const data = (await res.json()) as MensagemExterna[];
          setMessages(data);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label htmlFor="status-select" className="text-sm font-medium">
          Status:
        </label>
        <select
          id="status-select"
          value={status}
          onChange={(e) =>
            handleStatusChange(e.target.value as MensagemExternaStatus)
          }
          className="rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          disabled={loading}
        >
          <option value="pending">Pending</option>
          <option value="editing">Editing</option>
        </select>
        {loading && (
          <span className="text-sm text-muted-foreground">Carregando...</span>
        )}
      </div>
      <MensagemExternaTable messages={messages} />
    </div>
  );
}
