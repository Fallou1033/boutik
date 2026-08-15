import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, Phone, MapPin, Package, CreditCard } from "lucide-react";
import { formatXOF } from "@/lib/utils";
import Image from "next/image";
import OrderStatusUpdater from "@/components/dashboard/OrderStatusUpdater";
import PaymentLinkBox from "@/components/dashboard/PaymentLinkBox";

interface Props { params: { id: string } }

const STATUS_CONFIG: Record<string, { label: string; class: string; emoji: string }> = {
  pending:          { label: "Nouveau",       class: "badge-gray",   emoji: "🆕" },
  awaiting_payment: { label: "Att. paiement", class: "badge-yellow", emoji: "⏳" },
  paid:             { label: "Payé",          class: "badge-brand",  emoji: "✅" },
  preparing:        { label: "En préparation", class: "badge-purple", emoji: "📦" },
  shipped:          { label: "Expédié",       class: "badge-blue",   emoji: "🚚" },
  delivered:        { label: "Livré",         class: "badge-green",  emoji: "🎉" },
  cancelled:        { label: "Annulé",        class: "badge-red",    emoji: "❌" },
  refunded:         { label: "Remboursé",     class: "badge-gray",   emoji: "↩️" },
};

const PAYMENT_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  free_money: "Free Money",
  cash_on_delivery: "Paiement à la livraison",
};

export default async function OrderDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: merchant } = await supabase
    .from("merchants").select("id").eq("auth_user_id", user.id).single();
  if (!merchant) redirect("/auth/login");

  const { data: store } = await supabase
    .from("stores").select("id, whatsapp_number")
    .eq("merchant_id", (merchant as { id: string }).id).single();
  if (!store) redirect("/onboarding");

  const storeData = store as { id: string; whatsapp_number: string };

  const { data: orderRaw } = await supabase
    .from("orders")
    .select(`
      *,
      customers(id, full_name, phone),
      deliveries(recipient_name, recipient_phone, city, district, address_details, landmark, delivery_type, delivery_fee),
      order_items(id, product_name, product_image, unit_price, quantity, line_total)
    `)
    .eq("id", params.id)
    .eq("store_id", storeData.id)
    .single();

  if (!orderRaw) notFound();

  const order = orderRaw as {
    id: string; reference: string; order_status: string; payment_status: string;
    subtotal: number; delivery_fee: number; total: number; payment_method: string | null;
    customer_notes: string | null; created_at: string;
    customers: { id: string; full_name: string; phone: string } | null;
    deliveries: {
      recipient_name: string; recipient_phone: string; city: string;
      district: string; address_details: string | null; landmark: string | null;
      delivery_type: string; delivery_fee: number;
    } | null;
    order_items: Array<{
      id: string; product_name: string; product_image: string | null;
      unit_price: number; quantity: number; line_total: number;
    }>;
  };

  const status = STATUS_CONFIG[order.order_status];
  const whatsappPhone = order.customers?.phone.replace(/\D/g, "");
  const whatsappMsg = encodeURIComponent(
    `Bonjour ${order.customers?.full_name} ! Votre commande *${order.reference}* est en cours de traitement. 🛍️`
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/orders" className="btn-ghost btn-sm p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-text">{order.reference}</h1>
          <p className="text-text-muted text-xs">
            {new Date(order.created_at).toLocaleDateString("fr-FR", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
              hour: "2-digit", minute: "2-digit"
            })}
          </p>
        </div>
        <span className={`badge ${status?.class ?? "badge-gray"}`}>
          {status?.emoji} {status?.label}
        </span>
      </div>

      {/* Changement de statut */}
      <OrderStatusUpdater orderId={order.id} currentStatus={order.order_status} />

      {/* Lien de paiement */}
      <PaymentLinkBox
        reference={order.reference}
        paymentStatus={order.payment_status}
        orderStatus={order.order_status}
        customerPhone={order.customers?.phone ?? null}
        total={order.total}
      />

      {/* Client */}
      <div className="card card-body">
        <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Phone className="w-4 h-4 text-text-muted" /> Client
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-text">{order.customers?.full_name ?? "—"}</p>
            <p className="text-text-muted text-sm">{order.customers?.phone}</p>
          </div>
          <a
            href={`https://wa.me/${whatsappPhone}?text=${whatsappMsg}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-whatsapp btn-sm"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
        </div>
        {order.customer_notes && (
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700 font-medium">Note du client :</p>
            <p className="text-sm text-amber-900 mt-0.5">{order.customer_notes}</p>
          </div>
        )}
      </div>

      {/* Livraison */}
      {order.deliveries && (
        <div className="card card-body">
          <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-text-muted" /> Livraison
          </h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-text-muted">Type</span>
              <span className="font-medium text-text">
                {order.deliveries.delivery_type === "pickup" ? "🏪 Retrait boutique" : "🏠 À domicile"}
              </span>
            </div>
            {order.deliveries.delivery_type === "home" && (
              <>
                <div className="flex justify-between">
                  <span className="text-text-muted">Quartier</span>
                  <span className="font-medium text-text">{order.deliveries.district}</span>
                </div>
                {order.deliveries.address_details && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Adresse</span>
                    <span className="font-medium text-text text-right max-w-[60%]">{order.deliveries.address_details}</span>
                  </div>
                )}
                {order.deliveries.landmark && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Repère</span>
                    <span className="font-medium text-text text-right max-w-[60%]">{order.deliveries.landmark}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Produits */}
      <div className="card">
        <div className="card-header">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <Package className="w-4 h-4 text-text-muted" />
            Produits ({order.order_items.length})
          </h2>
        </div>
        <div className="divide-y divide-surface-border">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3">
              {item.product_image ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-muted flex-shrink-0">
                  <Image src={item.product_image} alt={item.product_name} width={48} height={48} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-surface-muted flex items-center justify-center flex-shrink-0">
                  <Package className="w-5 h-5 text-text-subtle" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text text-sm line-clamp-1">{item.product_name}</p>
                <p className="text-text-muted text-xs">{formatXOF(item.unit_price)} × {item.quantity}</p>
              </div>
              <p className="font-bold text-text text-sm tabular-nums flex-shrink-0">{formatXOF(item.line_total)}</p>
            </div>
          ))}
        </div>
        {/* Total */}
        <div className="px-5 py-4 border-t border-surface-border space-y-2">
          <div className="flex justify-between text-sm text-text-muted">
            <span>Sous-total</span>
            <span className="tabular-nums">{formatXOF(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-text-muted">
            <span>Livraison</span>
            <span className="tabular-nums">{order.delivery_fee === 0 ? "Gratuit" : formatXOF(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between font-bold text-text text-base border-t border-surface-border pt-2">
            <span>Total</span>
            <span className="tabular-nums text-brand-600">{formatXOF(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Paiement */}
      {order.payment_method && (
        <div className="card card-body">
          <h2 className="font-semibold text-text mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-text-muted" /> Paiement
          </h2>
          <p className="text-sm text-text-muted">
            Méthode : <strong className="text-text">{PAYMENT_LABELS[order.payment_method] ?? order.payment_method}</strong>
          </p>
          <p className="text-sm text-text-muted mt-1">
            Statut : <strong className={order.payment_status === "paid" ? "text-brand-600" : "text-amber-600"}>
              {order.payment_status === "paid" ? "✅ Payé" : "⏳ En attente"}
            </strong>
          </p>
        </div>
      )}
    </div>
  );
}
