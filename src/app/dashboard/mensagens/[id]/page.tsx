import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchMensagemExternaById } from "@/lib/api/mensagem-externa";

import { MensagemForm } from "./mensagem-form";

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

      <MensagemForm mensagem={mensagem} />
    </div>
  );
}
