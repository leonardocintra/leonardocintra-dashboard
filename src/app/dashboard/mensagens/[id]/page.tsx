import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { fetchMensagemExternaById } from "@/lib/api/mensagem-externa";

export default async function MensagemDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let mensagem;
  try {
    mensagem = await fetchMensagemExternaById(id);
  } catch {
    notFound();
  }

  const dataCriacao = new Date(mensagem.createdAt).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="space-y-6 p-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Voltar para mensagens
      </Link>

      <h1 className="text-2xl font-bold tracking-tight">
        Mensagem #{mensagem.id}
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Mensagem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                ID
              </span>
              <p className="text-sm">{mensagem.id}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Origem
              </span>
              <p className="text-sm">{mensagem.origem}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Status
              </span>
              <p className="text-sm capitalize">{mensagem.status}</p>
            </div>
            <div className="space-y-1">
              <span className="text-sm font-medium text-muted-foreground">
                Data de Criação
              </span>
              <p className="text-sm">{dataCriacao}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Mensagem
            </span>
            <p className="whitespace-pre-wrap break-words text-sm">
              {mensagem.message}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
