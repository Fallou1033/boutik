import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  ShoppingCart, Package, TrendingUp, Users,
  ArrowUpRight, ArrowDownRight, Eye, Clock
} from "lucide-react";
import Link from "next/link";
import { formatXOF } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Récupérer le marchand et la boutique
  const { data: merchant } = await supabase
    .from("merchants").select("id, full_name, plan")
    .eq("auth_user_id", user.id).single();

  if (!merchant) redirect("/auth/login");

  const { data: store } = await supabase
    .from("stores").select("id, name, slug")
    .eq("merchant_id", (merchant as { id: string }).id).single();

  if (!store) redirect("/onboarding");

  const storeData = store as { id: string; name: string; slug: string };

  // Stats
  const { count: totalOrders } = await supabase
    .from("orders").select("*", { count: "exact", head: true })
    .eq("store_id", storeData.id);

  const { count: totalProducts } = await supabase
    .from("products").select("*", { count: "exact", head: true })
    .eq("store_id", storeData.id).eq("is_active", true);

  const { data: revenueData } = await supabase
    .from("orders").select("total")
    .eq("store_id", storeData.id)
    .eq("payment_status", "paid");

  const totalRevenue = (revenueData ?? []).reduce(
    (sum: number, o: { total: number }) => sum + o.total, 0
  );

  const { count: pendingOrders } = await supabase
    .from("orders").select("*", { count: "exact", head: true })
    .eq("store_id", storeData.id)
    .in("order_status", ["pending", "awaiting_payment", "paid", "preparing"]);

  // Commandes récentes
  const { data: recentOrdersRaw } = await supabase
    .from("orders")
    .select("id, reference, order_status, total, created_at, customers(full_name, phone)")
    .eq("store_id", storeData.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentOrders = (recentOrdersRaw ?? []) as Array<{
    id: string; reference: string; order_status: string;
    total: number; created_at: string;
    customers: { full_name: string; phone: string } | null;
  }>;

  const merchantData = merchant as { id: string; full_name: string; plan: string };
  const firstName = merchantData.full_name?.split(" ")[0] ?? "là";

  const STATS = [
    {
      label: "Chiffre d'affaires",
      value: formatXOF(totalRevenue),
      icon: TrendingUp,
      color: "text-brand-600",
      bg: "bg-brand-50",
    },
    {
      label: "Commandes totales",
      value: totalOrders ?? 0,
      icon: ShoppingCart,
      color: "text-violet-600",
      bg: "bg-violet-50",
    },
    {
      label: "Produits actifs",
      value: totalProducts ?? 0,
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "En attente",
      value: pendingOrders ?? 0,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
  ];

  const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
    pending:          { label: "Nouveau",   class: "badge-gray" },
    awaiting_payment: { label: "Paiement",  class: "badge-yellow" },
    paid:             { label: "Payé",      class: "badge-brand" },
    preparing:        { label: "Prépa.",    class: "badge-purple" },
    shipped:          { label: "Expédié",   class: "badge-blue" },
    delivered:        { label: "Livré",     class: "badge-green" },
    cancelled:        { label: "Annulé",    class: "badge-red" },
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text">Bonjour {firstName} 👋</h1>
          <p className="text-text-muted text-sm mt-1">
            Voici un aperçu de votre boutique <strong>{storeData.name}</strong>
          </p>
        </div>
        <Link href={`/${storeData.slug}`} target="_blank"
          className="btn-secondary btn-md gap-2 self-start sm:self-auto">
          <Eye className="w-4 h-4" />
          Voir ma boutique
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="card card-body">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <p className="text-2xl font-bold text-text tabular-nums">{stat.value}</p>
            <p className="text-text-muted text-xs mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/dashboard/products/new"
          className="card card-body hover:shadow-card-hover hover:-translate-y-0.5 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Package className="w-5 h-5 text-white" />
          </div>
          <p className="font-semibold text-text">Ajouter un produit</p>
          <p className="text-text-muted text-sm mt-1">Enrichissez votre catalogue</p>
          <ArrowUpRight className="w-4 h-4 text-text-subtle mt-3" />
        </Link>

        <Link href="/dashboard/orders"
          className="card card-body hover:shadow-card-hover hover:-translate-y-0.5 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-violet-500 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ShoppingCart className="w-5 h-5 text-white" />
          </div>
          <p className="font-semibold text-text">Voir les commandes</p>
          <p className="text-text-muted text-sm mt-1">
            {pendingOrders} en attente de traitement
          </p>
          <ArrowUpRight className="w-4 h-4 text-text-subtle mt-3" />
        </Link>

        <Link href="/dashboard/settings"
          className="card card-body hover:shadow-card-hover hover:-translate-y-0.5 transition-all cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Users className="w-5 h-5 text-white" />
          </div>
          <p className="font-semibold text-text">Partager ma boutique</p>
          <p className="text-text-muted text-sm mt-1">Instagram · WhatsApp · TikTok</p>
          <ArrowUpRight className="w-4 h-4 text-text-subtle mt-3" />
        </Link>
      </div>

      {/* Commandes récentes */}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="font-semibold text-text">Commandes récentes</h2>
          <Link href="/dashboard/orders" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
            Voir tout →
          </Link>
        </div>
        <div className="divide-y divide-surface-border">
          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-text-muted">
              <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-text-subtle" />
              <p>Aucune commande pour l'instant.</p>
              <p className="text-sm mt-1">Partagez votre boutique pour recevoir vos premières commandes !</p>
            </div>
          ) : (
            recentOrders.map((order) => {
              const status = STATUS_CONFIG[order.order_status] ?? { label: order.order_status, class: "badge-gray" };
              return (
                <Link
                  key={order.id}
                  href={`/dashboard/orders/${order.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-subtle transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-text text-sm">{order.reference}</p>
                      <span className={`badge ${status.class} text-2xs`}>{status.label}</span>
                    </div>
                    <p className="text-text-muted text-xs mt-0.5 truncate">
                      {order.customers?.full_name ?? "Client"} · {order.customers?.phone}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-text text-sm tabular-nums">{formatXOF(order.total)}</p>
                    <p className="text-text-subtle text-xs">
                      {new Date(order.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric", month: "short"
                      })}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
