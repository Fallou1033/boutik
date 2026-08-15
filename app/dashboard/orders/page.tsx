import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Search, Filter } from "lucide-react";
import { formatXOF } from "@/lib/utils";

interface Props {
  searchParams: { status?: string; page?: string };
}

const STATUS_CONFIG: Record<string, { label: string; class: string; emoji: string }> = {
  pending:          { label: "Nouveau",       class: "badge-gray",   emoji: "🆕" },
  awaiting_payment: { label: "Att. paiement", class: "badge-yellow", emoji: "⏳" },
  paid:             { label: "Payé",          class: "badge-brand",  emoji: "✅" },
  preparing:        { label: "En prépa.",     class: "badge-purple", emoji: "📦" },
  shipped:          { label: "Expédié",       class: "badge-blue",   emoji: "🚚" },
  delivered:        { label: "Livré",         class: "badge-green",  emoji: "🎉" },
  cancelled:        { label: "Annulé",        class: "badge-red",    emoji: "❌" },
  refunded:         { label: "Remboursé",     class: "badge-gray",   emoji: "↩️" },
};

const PAGE_SIZE = 20;

export default async function OrdersPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: merchant } = await supabase
    .from("merchants").select("id").eq("auth_user_id", user.id).single();
  if (!merchant) redirect("/auth/login");

  const { data: store } = await supabase
    .from("stores").select("id")
    .eq("merchant_id", (merchant as { id: string }).id).single();
  if (!store) redirect("/onboarding");

  const storeId = (store as { id: string }).id;
  const currentStatus = searchParams.status ?? "";
  const page = parseInt(searchParams.page ?? "1");
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("orders")
    .select(`
      id, reference, order_status, payment_status, total, created_at,
      customers(full_name, phone)
    `, { count: "exact" })
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (currentStatus) {
    query = query.eq("order_status", currentStatus);
  }

  const { data: ordersRaw, count } = await query;

  const orders = (ordersRaw ?? []) as Array<{
    id: string; reference: string; order_status: string; payment_status: string;
    total: number; created_at: string;
    customers: { full_name: string; phone: string } | null;
  }>;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text">Commandes</h1>
        <p className="text-text-muted text-sm mt-1">{count ?? 0} commande{(count ?? 0) !== 1 ? "s" : ""} au total</p>
      </div>

      {/* Filtres statut */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        <Link
          href="/dashboard/orders"
          className={`badge flex-shrink-0 cursor-pointer ${!currentStatus ? "badge-brand" : "badge-gray hover:badge-brand"}`}
        >
          Toutes
        </Link>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <Link
            key={status}
            href={`/dashboard/orders?status=${status}`}
            className={`badge flex-shrink-0 cursor-pointer ${currentStatus === status ? "badge-brand" : "badge-gray hover:badge-brand"}`}
          >
            {cfg.emoji} {cfg.label}
          </Link>
        ))}
      </div>

      {/* Liste */}
      <div className="card divide-y divide-surface-border">
        {orders.length === 0 ? (
          <div className="empty-state py-16">
            <ShoppingCart className="w-12 h-12 text-text-subtle mb-3" />
            <p className="font-medium text-text">Aucune commande</p>
            <p className="text-sm text-text-muted mt-1">
              {currentStatus ? "Aucune commande avec ce statut." : "Vos commandes apparaîtront ici."}
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const status = STATUS_CONFIG[order.order_status];
            return (
              <Link
                key={order.id}
                href={`/dashboard/orders/${order.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface-subtle transition-colors"
              >
                {/* Emoji statut */}
                <div className="text-2xl w-10 text-center flex-shrink-0">
                  {status?.emoji ?? "📋"}
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-text text-sm">{order.reference}</span>
                    <span className={`badge ${status?.class ?? "badge-gray"} text-2xs`}>
                      {status?.label ?? order.order_status}
                    </span>
                  </div>
                  <p className="text-text-muted text-xs mt-0.5 truncate">
                    {order.customers?.full_name ?? "Client"} · {order.customers?.phone}
                  </p>
                </div>

                {/* Prix + date */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-text tabular-nums">{formatXOF(order.total)}</p>
                  <p className="text-text-subtle text-xs">
                    {new Date(order.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {page > 1 && (
            <Link
              href={`/dashboard/orders?${currentStatus ? `status=${currentStatus}&` : ""}page=${page - 1}`}
              className="btn-secondary btn-sm"
            >
              ← Précédent
            </Link>
          )}
          <span className="btn-ghost btn-sm pointer-events-none">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/dashboard/orders?${currentStatus ? `status=${currentStatus}&` : ""}page=${page + 1}`}
              className="btn-secondary btn-sm"
            >
              Suivant →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
