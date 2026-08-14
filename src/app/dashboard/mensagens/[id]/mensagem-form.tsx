"use client";

import { Copy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MensagemExterna } from "@/lib/api/mensagem-externa";

const LINK_REGEX = /https?:\/\/[^\s<>"']+/g;

export function MensagemForm({ mensagem }: { mensagem: MensagemExterna }) {
  const router = useRouter();
  const [origem, setOrigem] = useState(mensagem.origem);
  const [status, setStatus] = useState(mensagem.status);
  const [message, setMessage] = useState(mensagem.message);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    mensagem.imageUrl ?? null,
  );
  const [imageName, setImageName] = useState<string | null>(
    mensagem.imageName ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fixedLink = "https://www.aviseiprecobom.com.br";

  const links = [...message.matchAll(LINK_REGEX)].map((m) => m[0]);

  const handleCopy = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const dataCriacao = new Date(mensagem.createdAt).toLocaleString("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  });

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setImageFile(file);
    setUploadError(null);

    if (!file) {
      setImageUrl(mensagem.imageUrl ?? null);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/mensagem-externa/${mensagem.id}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(data.error ?? `Upload failed (${response.status})`);
      }

      const data = (await response.json()) as { imageUrl: string, imageName: string };
      setImageUrl(data.imageUrl);
      setImageName(data.imageName);
    } catch (error) {
      const messageText =
        error instanceof Error ? error.message : String(error);
      setUploadError(messageText);
      setImageUrl(null);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (uploadError) {
      return;
    }
    if (uploading) {
      return;
    }

    setSaving(true);
    try {
      const body: {
        status: MensagemExterna["status"];
        message: string;
        imageUrl?: string;
        imageName?: string;
      } = { status, message };
      if (imageUrl && imageUrl !== "") {
        body.imageUrl = imageUrl;
      }
      if (imageName && imageName !== "") {
        body.imageName = imageName;
      }

      const response = await fetch(`/api/mensagem-externa/${mensagem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Save failed (${response.status})`);
      }

      router.push("/dashboard");
    } catch (error) {
      setSaving(false);
      const messageText =
        error instanceof Error ? error.message : String(error);
      setUploadError(messageText);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch(`/api/mensagem-externa/${mensagem.id}`, {
        method: "DELETE",
      });
      router.push("/dashboard");
    } catch {
      setDeleting(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  const imagePreviewUrl =
    imageFile && !uploadError ? URL.createObjectURL(imageFile) : null;

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Detalhes da Mensagem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="id">ID</Label>
            <Input id="id" value={mensagem.id} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="createdAt">Data de Criacao</Label>
            <Input id="createdAt" value={dataCriacao} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="origem">Origem</Label>
            <Input
              id="origem"
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as MensagemExterna["status"])
              }
              className="h-9 w-full min-w-0 rounded-3xl border border-transparent bg-input/50 px-3 py-1 text-base outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 md:text-sm"
            >
              <option value="pending">Pending</option>
              <option value="ok">OK</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Imagem</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
          />
          {uploading && (
            <p className="text-xs text-muted-foreground">Enviando imagem...</p>
          )}
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
          {imagePreviewUrl && (
            // biome-ignore lint/performance/noImgElement: preview uses local object URL
            <img
              src={imagePreviewUrl}
              alt="Preview da imagem selecionada"
              className="max-h-48 rounded-md border"
            />
          )}
          {!imagePreviewUrl && imageUrl && !imageFile && (
            // biome-ignore lint/performance/noImgElement: preview uses object URL or remote URL
            <img
              src={imageUrl}
              alt="Imagem da mensagem"
              className="max-h-48 rounded-md border"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Mensagem</Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={12}
            className="w-full rounded-3xl border border-transparent bg-input/50 px-3 py-2 text-sm outline-none transition-[color,box-shadow,background-color] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          />
          {links.length > 0 && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground">
                Links encontrados ({links.length})
              </span>
              <ul className="space-y-1">
                {links.map((url, index) => (
                  <li
                    key={index}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <Link
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-primary underline-offset-4 hover:underline"
                    >
                      {url}
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Copiar link"
                      onClick={() => handleCopy(url)}
                    >
                      {copiedUrl === url ? (
                        <span className="text-xs text-green-500">Copiado!</span>
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </Button>
                    <Input
                      type="url"
                      placeholder="Substituir por outro link..."
                      className="h-8 flex-1"
                      onBlur={(e) => {
                        const newUrl = e.target.value.trim();
                        if (newUrl && newUrl !== url) {
                          setMessage((prev) => prev.replace(url, newUrl));
                        }
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || uploading || !!uploadError}
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
            className="text-destructive"
          >
            {deleting ? "Deletando..." : "Deletar"}
          </Button>
        </div>

        <div className="space-y-2 pt-2">
          <span className="text-sm font-medium text-muted-foreground">
            Link pre definido
          </span>
          <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Link
              href={fixedLink}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-primary underline-offset-4 hover:underline"
            >
              {fixedLink}
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Copiar link"
              onClick={() => handleCopy(fixedLink)}
            >
              {copiedUrl === fixedLink ? (
                <span className="text-xs text-green-500">Copiado!</span>
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
