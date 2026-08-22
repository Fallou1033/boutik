"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ShoppingBag, Shield, Loader2, ExternalLink,
  Phone, Package, ChevronRight, Lock
} from "lucide-react";
import { formatXOF } from "@/lib/utils";
import { PaymentLogo } from "@/components/icons/PaymentLogos";

const MOBILE_MONEY_METHODS = [
  {
    id: "wave",
    name: "Wave",
    description: "Paiement instantané, 0 commission",
    color: "from-blue-500 to-blue-600",
    borderColor: "border-blue-400",
    bgColor: "bg-blue-50",
  },
  {
    id: "orange_money",
    name: "Orange Money",
    description: "Disponible 24h/24, 7j/7",
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-400",
    bgColor: "bg-orange-50",
  },
  {
    id: "free_money",
    name: "Free Money",
    description: "Transfert sans frais",
    color: "from-green-500 to-green-600",
    borderColor: "border-green-400",
    bgColor: "bg-green-50",
  },
] as const;

interface Order {
  id: string; reference: string; order_status: string;
  payment_status: string; total: number; subtotal: number;
  delivery_fee: number; payment_method: string | null; created_at: string;
  stores: { name: string; slug: string; whatsapp_number: string } | null;
  customers: { full_name: string; phone: string } | null;
  order_items: Array<{
    product_name: string; unit_price: number; quantity: number;
    line_total: number; product_image: string | null;
  }>;
}

interface Props { order: Order }

export default function PaymentPage({ order }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_reference: order.reference }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'initiation du paiement");
        setIsLoading(false);
        return;
      }

      // Redirection vers CinetPay
      // H-5: Réinitialiser isLoading car la navigation peut prendre du temps
      if (data.payment_url) {
        window.location.href = data.payment_url;
        // Fallback si la redirection est bloquée (popup blocker, réseau lent…)
        setTimeout(() => setIsLoading(false), 5000);
      } else {
        setIsLoading(false);
      }
    } catch {
      setError("Impossible de contacter la passerelle de paiement. Vérifiez votre connexion.");
      setIsLoading(false);
    }
  };


  const isPaid = order.payment_status === "paid";
  const isCancelled = order.order_status === "cancelled";

  return (
    <div className="min-h-screen bg-surface-subtle flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-surface-border sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <ShoppingBag className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-semibold text-text text-sm leading-tight">
              {order.stores?.name ?? "Boutik"}
            </p>
            <p className="text-text-subtle text-xs">Paiement sécurisé</p>
          </div>
          <div className="ml-auto flex items-center gap-1 text-brand-600">
            <Lock className="w-3.5 h-3.5" />
            <span className="text-xs font-medium">Sécurisé</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 py-6 space-y-5">
        {/* Référence */}
        <div className="text-center">
          <p className="text-text-muted text-sm">Commande</p>
          <p className="font-bold text-text text-lg tracking-wide">{order.reference}</p>
        </div>

        {/* Statut si déjà traité */}
        {isPaid && (
          <div className="card card-body text-center bg-brand-50 border-brand-200">
            <p className="text-4xl mb-2">✅</p>
            <p className="font-bold text-brand-700">Commande déjà payée !</p>
            <p className="text-sm text-brand-600 mt-1">Merci pour votre achat.</p>
          </div>
        )}

        {isCancelled && (
          <div className="card card-body text-center bg-red-50 border-red-200">
            <p className="text-4xl mb-2">❌</p>
            <p className="font-bold text-red-700">Commande annulée</p>
            <p className="text-sm text-red-600 mt-1">Cette commande ne peut plus être payée.</p>
          </div>
        )}

        {error && (
          <div className="alert-error animate-shake">
            ⚠️ {error}
            <p className="text-xs mt-1 opacity-80">
              Si le problème persiste, contactez le vendeur via WhatsApp.
            </p>
          </div>
        )}

        {/* Récapitulatif produits */}
        <div className="card">
          <div className="card-header">
            <h2 className="font-semibold text-text flex items-center gap-2">
              <Package className="w-4 h-4 text-text-muted" />
              Votre commande
            </h2>
          </div>
          <div className="divide-y divide-surface-border">
            {order.order_items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                {item.product_image ? (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-muted flex-shrink-0">
                    <Image
                      src={item.product_image} alt={item.product_name}
                      width={40} height={40} className="object-cover w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-text-subtle" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text line-clamp-1">{item.product_name}</p>
                  <p className="text-xs text-text-muted">{formatXOF(item.unit_price)} × {item.quantity}</p>
                </div>
                <p className="font-semibold text-text text-sm tabular-nums flex-shrink-0">
                  {formatXOF(item.line_total)}
                </p>
              </div>
            ))}
          </div>

          {/* Totaux */}
          <div className="px-5 py-4 border-t border-surface-border space-y-2 bg-surface-subtle">
            <div className="flex justify-between text-sm text-text-muted">
              <span>Sous-total</span>
              <span className="tabular-nums">{formatXOF(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-text-muted">
              <span>Livraison</span>
              <span className="tabular-nums">
                {order.delivery_fee === 0 ? "Gratuit" : formatXOF(order.delivery_fee)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-text text-lg pt-2 border-t border-surface-border">
              <span>Total à payer</span>
              <span className="tabular-nums text-brand-600">{formatXOF(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Méthodes de paiement */}
        {!isPaid && !isCancelled && (
          <div className="card card-body">
            <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
              <Phone className="w-4 h-4 text-text-muted" />
              Payer avec Mobile Money
            </h2>
            <div className="space-y-2 mb-5">
              {MOBILE_MONEY_METHODS.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center gap-3 p-3 rounded-xl ${method.bgColor} border border-transparent`}
                >
                  <PaymentLogo method={method.id} className="w-9 h-9 rounded-xl shadow-sm flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-text text-sm">{method.name}</p>
                    <p className="text-text-muted text-xs">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handlePay}
              disabled={isLoading}
              className="btn-primary btn-lg w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Redirection vers le paiement...
                </>
              ) : (
                <>
                  Payer {formatXOF(order.total)}
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>

            {/* Sécurité */}
            <div className="flex items-center gap-2 mt-4 justify-center text-text-subtle">
              <Shield className="w-4 h-4" />
              <p className="text-xs">Paiement sécurisé par CinetPay · Données chiffrées SSL</p>
            </div>
          </div>
        )}

        {/* Contact vendeur si problème */}
        {order.stores?.whatsapp_number && (
          <a
            href={`https://wa.me/${order.stores.whatsapp_number.replace(/\D/g, "")}?text=${encodeURIComponent(`Bonjour, j'ai une question sur ma commande ${order.reference}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp btn-md w-full"
          >
            <span>💬</span> Contacter le vendeur
          </a>
        )}
      </main>
    </div>
  );
}
