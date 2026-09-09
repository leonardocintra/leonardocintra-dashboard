"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MensagemExterna } from "@/lib/api/mensagem-externa";
import { cn } from "@/lib/utils";

const ROW_FADE_MS = 300;

const ORIGEM_IMAGE_BY_VALUE: Record<string, string> = {
  AMAZON: "/AMAZON.jpg",
  MERCADO_LIVRE: "/MERCADO_LIVRE.jpeg",
  SHOPEE: "/SHOPEE.jpg",
  NAO_IDENTIFICADA: "/NAO_IDENTIFICADA.jpg",
};

function getOrigemImage(origem?: string | null) {
  if (!origem) return null;

  return ORIGEM_IMAGE_BY_VALUE[origem.trim().toUpperCase()] ?? null;
}

export function MensagemExternaTable({
  messages,
  onDeleted,
}: {
  messages: MensagemExterna[];
  onDeleted: (id: number) => void;
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [removingIds, setRemovingIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);

  function toggleSelection(id: number, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }

  async function deleteMessage(id: number) {
    let deleted = false;
    try {
      const res = await fetch(`/api/mensagem-externa/${id}`, {
        method: "DELETE",
      });
      deleted = res.ok;
    } catch {
      deleted = false;
    }

    if (!deleted) return;

    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    await new Promise((resolve) => setTimeout(resolve, ROW_FADE_MS));
    onDeleted(id);
    setRemovingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function handleDelete() {
    if (deleting || selectedIds.size === 0) return;
    setDeleting(true);

    for (const id of [...selectedIds]) {
      await deleteMessage(id);
    }

    setDeleting(false);
  }

  const hasSelection = selectedIds.size > 0;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "grid transition-all duration-300",
          hasSelection
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              disabled={deleting}
              onClick={handleDelete}
              tabIndex={hasSelection ? 0 : -1}
              aria-hidden={!hasSelection}
            >
              <Trash2 className="size-4" />
              Excluir ({selectedIds.size})
            </Button>
          </div>
        </div>
      </div>
      <div className="w-full rounded-md border">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">ID</TableHead>
              <TableHead className="w-44">Data</TableHead>
              <TableHead className="w-[calc(100%-16rem)] overflow-hidden">
                Mensagem
              </TableHead>
              <TableHead className="w-44">Origem</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-muted-foreground"
                >
                  Nenhuma mensagem encontrada
                </TableCell>
              </TableRow>
            ) : (
              messages.map((message) => {
                const origemImage = getOrigemImage(message.origem);

                return (
                  <TableRow
                    data-message-id={`message-id-${message.id}`}
                    key={message.id}
                    className={cn(
                      "cursor-pointer transition-opacity duration-300",
                      removingIds.has(message.id) && "opacity-0",
                    )}
                    onClick={() =>
                      router.push(`/dashboard/mensagens/${message.id}`)
                    }
                  >
                    <TableCell className="max-w-0 truncate font-medium">
                      {message.id}
                    </TableCell>
                    <TableCell className="max-w-0 truncate">
                      {new Date(message.createdAt).toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="max-w-0">
                      <span className="block whitespace-pre-line">
                        {message.message}
                      </span>
                    </TableCell>
                    <TableCell>
                      {origemImage ? (
                        <div className="flex items-center justify-center">
                          <Image
                            src={origemImage}
                            alt={`Origem ${message.origem}`}
                            width={180}
                            height={82}
                            className="h-20 w-auto object-contain rounded-3xl shadow-2xl"
                          />
                        </div>
                      ) : (
                        <span>{message.origem}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                      <Checkbox
                        checked={selectedIds.has(message.id)}
                        onCheckedChange={(checked) =>
                          toggleSelection(message.id, checked)
                        }
                        onClick={(event) => event.stopPropagation()}
                        aria-label={`Selecionar mensagem ${message.id}`}
                      />
                      <Button
                        variant="ghost"
                        size="lg"
                        onClick={(event) => {
                          event.stopPropagation();
                          deleteMessage(message.id);
                        }}
                        aria-label={`Excluir mensagem ${message.id}`}
                      >
                        <Trash2 className="size-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
