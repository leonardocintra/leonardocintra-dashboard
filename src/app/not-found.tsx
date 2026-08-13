import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-6xl font-bold tracking-tight">404</h1>
      <p className="text-lg text-muted-foreground">Página não encontrada.</p>
      <Link
        href="/dashboard"
        className="rounded-3xl bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Voltar para o Dashboard
      </Link>
    </div>
  );
}
