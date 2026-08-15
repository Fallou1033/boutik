import type { Order, OrderItem, Store } from "@/types/database.types";
import { formatXOF, normalizePhone } from "@/lib/utils";

interface OrderSummaryForWhatsApp {
  reference: string;
  storeName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  deliveryFee: number;
  total: number;
  customerName: string;
  customerPhone: string;
  district: string;
  landmark?: string;
  paymentMethod: Order["payment_method"];
}

const PAYMENT_LABELS: Record<string, string> = {
  wave:             "💙 Wave",
  orange_money:     "🟠 Orange Money",
  free_money:       "🟢 Free Money",
  cash_on_delivery: "💵 Paiement à la livraison",
};

/**
 * generateWhatsAppDeepLink — Crée un lien wa.me avec un message pré-formaté.
 *
 * V1 — Zéro coût API, fonctionne sur tous les appareils Android/iOS.
 * Utilisé côté CLIENT après confirmation de commande.
 */
export function generateWhatsAppDeepLink(
  vendorWhatsApp: string,
  order: OrderSummaryForWhatsApp
): string {
  const phone = normalizePhone(vendorWhatsApp).replace("+", "");

  const itemsList = order.items
    .map(
      (item) =>
        `  • ${item.name} ×${item.quantity} — ${formatXOF(item.price * item.quantity)}`
    )
    .join("\n");

  const paymentLabel = PAYMENT_LABELS[order.paymentMethod ?? ""] ?? order.paymentMethod ?? "—";

  const message = [
    `🛍️ *NOUVELLE COMMANDE — ${order.storeName}*`,
    `━━━━━━━━━━━━━━━━━━━━`,
    `📋 Réf: *${order.reference}*`,
    ``,
    `🛒 *ARTICLES COMMANDÉS:*`,
    itemsList,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `💰 Sous-total:    ${formatXOF(order.subtotal)}`,
    `🚚 Livraison:     ${formatXOF(order.deliveryFee)}`,
    `✅ *TOTAL:        ${formatXOF(order.total)}*`,
    ``,
    `💳 Paiement: ${paymentLabel}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `👤 *CLIENT:*`,
    `   Nom:      ${order.customerName}`,
    `   Tél:      ${order.customerPhone}`,
    `   Quartier: ${order.district}`,
    order.landmark ? `   Repère:   ${order.landmark}` : null,
    ``,
    `━━━━━━━━━━━━━━━━━━━━`,
    `_Envoyé via Boutik_ 🔗`,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * buildWhatsAppCloudPayload — Structure pour WhatsApp Cloud API (Meta) v2.
 * À utiliser dans une Edge Function avec les credentials Meta Business.
 * Template "order_confirmation_sn" doit être approuvé par Meta.
 */
export function buildWhatsAppCloudPayload(
  customerPhone: string,
  order: Pick<Order, "reference" | "total"> & { storeName: string }
) {
  return {
    messaging_product: "whatsapp",
    to: normalizePhone(customerPhone).replace("+", ""),
    type: "template",
    template: {
      name: "order_confirmation_sn",
      language: { code: "fr" },
      components: [
        {
          type: "header",
          parameters: [{ type: "text", text: order.storeName }],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: order.reference },
            {
              type: "currency",
              currency: {
                fallback_value: `${order.total} FCFA`,
                code: "XOF",
                amount_1000: order.total * 1000,
              },
            },
          ],
        },
      ],
    },
  };
}
