"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingBag, LayoutDashboard, Package, ShoppingCart,
  Settings, ExternalLink, Menu, X, LogOut, ChevronRight,
  Bell, Store
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface Props {
  user: User;
  store: { id: string; slug: string; name: string } | null;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard",          label: "Vue d'ensemble",  icon: LayoutDashboard, exact: true },
  { href: "/dashboard/products", label: "Produits",        icon: Package },
  { href: "/dashboard/orders",   label: "Commandes",       icon: ShoppingCart },
  { href: "/dashboard/settings", label: "Paramètres",      icon: Settings },
];

export default function DashboardShell({ user, store, children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-surface-subtle flex">
      {/* ── Overlay mobile ───────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-slate-900 text-white z-50 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center flex-shrink-0 shadow-glow">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white leading-tight truncate">
              {store?.name ?? "Boutik"}
            </p>
            <p className="text-white/40 text-xs truncate">
              {store ? `boutik.app/${store.slug}` : "Aucune boutique"}
            </p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/40 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voir boutique */}
        {store && (
          <div className="px-3 py-3 border-b border-white/10">
            <Link
              href={`/${store.slug}`}
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/5 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Voir ma boutique
            </Link>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive(item.href, item.exact)
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
              {isActive(item.href, item.exact) && (
                <ChevronRight className="w-4 h-4 ml-auto opacity-60" />
              )}
            </Link>
          ))}
        </nav>

        {/* Footer sidebar */}
        <div className="px-3 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user.email?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.user_metadata?.full_name ?? user.email}
              </p>
              <p className="text-white/40 text-xs">Plan Gratuit</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-xl text-sm text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-surface border-b border-surface-border px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-surface-muted text-text-muted"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <ShoppingBag className="w-5 h-5 text-brand-500" />
            <span className="font-bold text-text">{store?.name ?? "Boutik"}</span>
          </div>
          <button className="p-2 rounded-lg hover:bg-surface-muted text-text-muted">
            <Bell className="w-5 h-5" />
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {!store ? (
            <OnboardingBanner />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

function OnboardingBanner() {
  return (
    <div className="max-w-lg mx-auto mt-12 text-center animate-fade-in">
      <div className="w-20 h-20 rounded-3xl bg-gradient-brand mx-auto flex items-center justify-center shadow-glow mb-6">
        <Store className="w-10 h-10 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-text mb-2">Créez votre boutique !</h2>
      <p className="text-text-muted mb-8">
        Vous n'avez pas encore de boutique. Créez-en une maintenant pour commencer à vendre.
      </p>
      <Link href="/onboarding" className="btn-primary btn-lg">
        Créer ma boutique <ChevronRight className="w-5 h-5" />
      </Link>
    </div>
  );
}
