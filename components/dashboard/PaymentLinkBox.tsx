"use client";

import { useState } from "react";
import { Copy, CheckCheck, MessageCircle, ExternalLink, CreditCard } from "lucide-react";
import { formatXOF, cn } from "@/lib/utils";

interface Props {
  reference: string;
  paymentStatus: string;
  orderStatus: string;
  customerPhone: string | null;
  total: number;
}

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; class: string; emoji: string }> = {
  unpaid:     { label: "Non payé",   class: "badge-yellow", emoji: "⏳" },
  awaiting:   { label: "En attente", class: "badge-yellow", emoji: "⏳" },
  paid:       { label: "Payé",       class: "badge-green",  emoji: "✅" },
  failed:     { label: "Échoué",     class: "badge-red",    emoji: "❌" },
  refunded:   { label: "Remboursé",  class: "badge-gray",   emoji: "↩️" },
};

export default function PaymentLinkBox({
  reference, paymentStatus, orderStatus, customerPhone, total,
}: Props) {
  const [copied, setCopied] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const paymentLink = `${appUrl}/pay/${reference}`;

  const statusCfg = PAYMENT_STATUS_CONFIG[paymentStatus] ?? PAYMENT_STATUS_CONFIG.unpaid;
  const isPaid = paymentStatus === "paid";
  const isCancelled = orderStatus === "cancelled";
  const canPay = !isPaid && !isCancelled;

  const copyLink = async () => {
    await navigator.clipboard.writeText(paymentLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendViaWhatsApp = () => {
    if (!customerPhone) return;
    const phone = customerPhone.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `Bonjour ! 🛍️ Voici le lien de paiement sécurisé pour votre commande *${reference}* de ${formatXOF(total)} :\n\n👉 ${paymentLink}\n\nVous pouvez payer par Wave, Orange Money ou Free Money. Merci ! 🙏`
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  return (
    <div className="card card-body">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-text flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-text-muted" />
          Paiement
        </h2>
        <span className={`badge ${statusCfg.class}`}>
          {statusCfg.emoji} {statusCfg.label}
        </span>
      </div>

      {isPaid ? (
        <div className="p-3 bg-brand-50 rounded-xl border border-brand-100">
          <p className="text-brand-700 font-medium text-sm">✅ Paiement confirmé</p>
          <p className="text-brand-600 text-xs mt-0.5">{formatXOF(total)} reçu</p>
        </div>
      ) : canPay ? (
        <>
          {/* Lien de paiement */}
          <div className="mb-3">
            <p className="text-xs text-text-muted mb-2">Lien de paiement pour le client :</p>
            <div className="flex gap-2">
              <div className="flex-1 input bg-surface-subtle text-text-muted text-xs truncate flex items-center py-2">
                {paymentLink}
              </div>
              <button
                onClick={copyLink}
                title="Copier le lien"
                className={cn(
                  "btn-secondary btn-sm p-2 flex-shrink-0",
                  copied && "text-brand-600 border-brand-300"
                )}
              >
                {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                title="Ouvrir"
                className="btn-ghost btn-sm p-2 flex-shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {customerPhone && (
              <button
                onClick={sendViaWhatsApp}
                className="btn-whatsapp btn-sm flex-1 text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Envoyer via WhatsApp
              </button>
            )}
          </div>

          <p className="text-xs text-text-subtle mt-3 text-center">
            Le client paie par Wave, Orange Money ou Free Money
          </p>
        </>
      ) : (
        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
          <p className="text-red-700 text-sm">Commande annulée — paiement non disponible</p>
        </div>
      )}
    </div>
  );
}
