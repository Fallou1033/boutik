"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2, MessageCircle, RefreshCw, Home } from "lucide-react";
import { formatXOF } from "@/lib/utils";

interface PaymentStatus {
  reference: string;
  order_status: string;
  payment_status: string;
  total: number;
  is_paid: boolean;
}

export default function PaymentResultPage() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const statusParam = searchParams.get("status"); // "success" | "failed" | undefined

  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [pollCount, setPollCount] = useState(0);
  const MAX_POLLS = 12; // 12 × 5s = 60s max

  const checkStatus = useCallback(async () => {
    if (!ref) return;
    try {
      const res = await fetch(`/api/payment/status?ref=${encodeURIComponent(ref)}`);
      if (res.ok) {
        const data: PaymentStatus = await res.json();
        setStatus(data);
        setLoading(false);
        return data.is_paid;
      }
    } catch {
      /* réseau instable — on réessaie */
    }
    return false;
  }, [ref]);

  useEffect(() => {
    if (!ref) { setLoading(false); return; }

    // Premier check immédiat
    checkStatus().then((paid) => {
      if (paid || statusParam === "failed") return;

      // Si pas encore payé, on poll toutes les 5s (réseau 3G ok)
      if (pollCount < MAX_POLLS) {
        const interval = setInterval(async () => {
          const isPaid = await checkStatus();
          setPollCount((c) => c + 1);
          if (isPaid || pollCount >= MAX_POLLS) clearInterval(interval);
        }, 5000);
        return () => clearInterval(interval);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref]);

  if (!ref) {
    return (
      <ResultLayout>
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-text">Lien invalide</h1>
          <p className="text-text-muted mt-2">Aucune référence de commande trouvée.</p>
          <Link href="/" className="btn-primary btn-md mt-6 inline-flex">
            <Home className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </ResultLayout>
    );
  }

  // En cours de vérification
  if (loading || (!status && pollCount < MAX_POLLS)) {
    return (
      <ResultLayout>
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-10 h-10 text-brand-500 animate-spin" />
          </div>
          <h1 className="text-xl font-bold text-text">Vérification du paiement…</h1>
          <p className="text-text-muted text-sm mt-2">
            Votre paiement est en cours de confirmation.
          </p>
          <p className="text-text-subtle text-xs mt-1">
            Cela peut prendre quelques secondes.
          </p>

          {/* Barre de progression */}
          <div className="w-full bg-surface-muted rounded-full h-1.5 mt-6 mx-auto max-w-xs">
            <div
              className="bg-brand-500 h-1.5 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, (pollCount / MAX_POLLS) * 100)}%` }}
            />
          </div>
        </div>
      </ResultLayout>
    );
  }

  // Succès
  if (status?.is_paid || statusParam === "success") {
    return (
      <ResultLayout>
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-brand-500" />
          </div>
          <h1 className="text-2xl font-bold text-text mb-1">Paiement réussi ! 🎉</h1>
          <p className="text-text-muted text-sm">
            Commande <strong className="text-text">{ref}</strong>
          </p>
          {status?.total && (
            <p className="text-3xl font-bold text-brand-600 mt-4 tabular-nums">
              {formatXOF(status.total)}
            </p>
          )}

          <div className="mt-8 space-y-3">
            <div className="p-4 bg-brand-50 rounded-2xl border border-brand-100 text-left">
              <p className="font-semibold text-brand-800 text-sm mb-1">✅ Ce qui se passe ensuite :</p>
              <ul className="text-brand-700 text-sm space-y-1">
                <li>• Le vendeur prépare votre commande</li>
                <li>• Vous serez contacté via WhatsApp</li>
                <li>• Livraison ou retrait selon votre choix</li>
              </ul>
            </div>

            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Ma commande ${ref} a été payée avec succès !`)}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-whatsapp btn-lg w-full"
            >
              <MessageCircle className="w-5 h-5" />
              Contacter le vendeur
            </a>
            <Link href="/" className="btn-ghost btn-md w-full">
              <Home className="w-4 h-4" /> Retour à l'accueil
            </Link>
          </div>
        </div>
      </ResultLayout>
    );
  }

  // Échec ou timeout
  return (
    <ResultLayout>
      <div className="text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-text mb-1">Paiement non confirmé</h1>
        <p className="text-text-muted text-sm">
          {statusParam === "failed"
            ? "Le paiement a été refusé ou annulé."
            : "Nous n'avons pas pu confirmer votre paiement."}
        </p>

        <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100 text-left">
          <p className="font-semibold text-amber-800 text-sm mb-1">💡 Que faire ?</p>
          <ul className="text-amber-700 text-sm space-y-1">
            <li>• Vérifiez votre solde Mobile Money</li>
            <li>• Relancez le paiement ci-dessous</li>
            <li>• Ou contactez le vendeur via WhatsApp</li>
          </ul>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href={`/pay/${ref}`}
            className="btn-primary btn-lg w-full"
          >
            <RefreshCw className="w-5 h-5" />
            Réessayer le paiement
          </Link>
          <Link href="/" className="btn-ghost btn-md w-full">
            <Home className="w-4 h-4" /> Retour à l'accueil
          </Link>
        </div>
      </div>
    </ResultLayout>
  );
}

function ResultLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-surface rounded-3xl shadow-2xl p-8">
        {children}
      </div>
    </div>
  );
}
