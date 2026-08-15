"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { MensagemExternaTable } from "@/components/mensagem-externa-table";
import { Progress } from "@/components/ui/progress";
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
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleStatusChange = useCallback(
    async (newStatus: MensagemExternaStatus) => {
      setStatus(newStatus);
      setProgress(0);
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
      }
    },
    [],
  );

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 10;
      });
      fetch(`/api/mensagem-externa?status=${status}`)
        .then((res) => {
          if (res.ok) {
            return res.json() as Promise<MensagemExterna[]>;
          }
          return [];
        })
        .then((data) => {
          setMessages(data);
        })
        .catch(() => {
          setMessages([]);
        });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

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
        >
          <option value="pending">Pending</option>
          <option value="ok">OK</option>
        </select>
        <Progress value={progress} className="w-32" />
      </div>
      <MensagemExternaTable messages={messages} />
    </div>
  );
}
