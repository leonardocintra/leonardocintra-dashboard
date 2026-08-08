"use client";

import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MensagemExterna } from "@/lib/api/mensagem-externa";

export function MensagemExternaTable({
  messages,
}: {
  messages: MensagemExterna[];
}) {
  const router = useRouter();

  return (
    <div className="w-full rounded-md border">
      <Table className="table-fixed">
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">ID</TableHead>
            <TableHead className="w-40">Origem</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="w-[calc(100%-13rem)] overflow-hidden">
              Mensagem
            </TableHead>
            <TableHead className="w-20 text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-muted-foreground"
              >
                Nenhuma mensagem encontrada
              </TableCell>
            </TableRow>
          ) : (
            messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell className="max-w-0 truncate font-medium">
                  {message.id}
                </TableCell>
                <TableCell className="max-w-0 truncate">
                  {message.origem}
                </TableCell>
                <TableCell className="max-w-0 truncate capitalize">
                  {message.status}
                </TableCell>
                <TableCell className="max-w-0">
                  <span
                    title={message.message}
                    className="block truncate"
                  >
                    {[...message.message].length > 100
                      ? `${[...message.message].slice(0, 100).join("")}…`
                      : message.message}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Ver detalhes"
                    onClick={() =>
                      router.push(`/dashboard/mensagens/${message.id}`)
                    }
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
