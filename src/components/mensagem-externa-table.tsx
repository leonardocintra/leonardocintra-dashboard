"use client";

import { Pencil } from "lucide-react";

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
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">ID</TableHead>
            <TableHead className="w-37.5">Origem</TableHead>
            <TableHead className="w-30">Status</TableHead>
            <TableHead>Mensagem</TableHead>
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
                <TableCell className="font-medium">{message.id}</TableCell>
                <TableCell>{message.origem}</TableCell>
                <TableCell className="capitalize">{message.status}</TableCell>
                <TableCell className="max-w-md">
                  <span title={message.message}>
                    {message.message.length > 100
                      ? `${message.message.slice(0, 100)}…`
                      : message.message}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Editar"
                    onClick={() => {
                      // Edit action stub — to be wired later
                    }}
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
