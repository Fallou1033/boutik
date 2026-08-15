import { notFound } from "next/navigation";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-subtle">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">🏪</div>
        <h1 className="text-2xl font-bold text-text mb-2">Boutique introuvable</h1>
        <p className="text-text-muted mb-6">
          Cette boutique n'existe pas ou n'est plus disponible.
        </p>
        <a href="/" className="btn-primary btn-md">
          Retour à l'accueil
        </a>
      </div>
    </div>
  );
}
