import Link from "next/link";
import { ShoppingBag, Zap, MessageCircle, TrendingUp, ArrowRight, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutik — Vendez en ligne, encaissez par Wave",
  description:
    "Créez votre boutique en ligne en 5 minutes. Partagez sur WhatsApp, Instagram, TikTok. Encaissez par Wave ou Orange Money.",
};

const features = [
  {
    icon: ShoppingBag,
    title: "Catalogue ultra-rapide",
    desc: "Créez votre boutique en 5 minutes. Ajoutez vos produits avec photos et prix. Votre catalogue est disponible instantanément.",
    color: "brand",
  },
  {
    icon: MessageCircle,
    title: "Commerce social",
    desc: "Partagez votre lien boutique sur WhatsApp, Instagram et TikTok. Recevez les commandes directement sur WhatsApp.",
    color: "violet",
  },
  {
    icon: Zap,
    title: "Paiement Mobile Money",
    desc: "Encaissez par Wave, Orange Money ou Free Money. Zéro terminal bancaire, zéro friction pour vos clients.",
    color: "brand",
  },
  {
    icon: TrendingUp,
    title: "Tableau de bord vendeur",
    desc: "Suivez vos commandes en temps réel. Gérez le stock, confirmez les livraisons depuis votre téléphone.",
    color: "violet",
  },
];

const plans = [
  {
    name: "Gratuit",
    price: 0,
    period: "pour toujours",
    features: ["10 produits", "Commandes illimitées", "Lien WhatsApp", "Catalogue public"],
    cta: "Commencer gratuitement",
    primary: false,
  },
  {
    name: "Starter",
    price: 4900,
    period: "/ mois",
    features: ["50 produits", "5 photos / produit", "Analytiques basiques", "Support prioritaire"],
    cta: "Essayer 14 jours",
    primary: true,
  },
  {
    name: "Pro",
    price: 14900,
    period: "/ mois",
    features: ["Produits illimités", "Analytiques avancées", "Domaine personnalisé", "API & intégrations"],
    cta: "Contacter les ventes",
    primary: false,
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* ── Navigation ──────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-border">
        <div className="page-container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg text-text">Boutik</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-ghost btn-sm hidden sm:inline-flex">
              Se connecter
            </Link>
            <Link href="/auth/login" className="btn-primary btn-sm">
              Créer ma boutique
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative bg-gradient-hero overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" />
        </div>

        <div className="relative page-container py-20 sm:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm mb-8 animate-fade-in">
            <Zap className="w-4 h-4 text-brand-400" />
            <span>Paiement Wave & Orange Money intégré</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-6 animate-slide-up">
            Vendez en ligne,{" "}
            <span className="text-gradient-brand">encaissez</span>
            <br />
            par Mobile Money
          </h1>

          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto mb-10 animate-slide-up">
            Créez votre boutique en ligne en 5 minutes. Partagez sur WhatsApp,
            Instagram et TikTok. Vos clients commandent, vous encaissez par Wave ou Orange Money.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link href="/auth/login" className="btn-primary btn-lg text-base">
              Créer ma boutique gratuite
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#demo" className="btn-ghost btn-lg text-white/80 hover:text-white hover:bg-white/10 text-base">
              Voir une démo
            </Link>
          </div>

          <p className="text-white/40 text-sm mt-6">
            Aucune carte bancaire requise · Gratuit à vie jusqu'à 10 produits
          </p>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface-subtle" id="fonctionnalites">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-text-muted text-lg max-w-xl mx-auto">
              Une solution complète pensée pour les commerçants du Sénégal,
              optimisée pour les réseaux mobiles 3G/4G.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card card-body hover:shadow-card-hover transition-all duration-200">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                    f.color === "brand"
                      ? "bg-brand-100"
                      : "bg-violet-100"
                  }`}
                >
                  <f.icon
                    className={`w-6 h-6 ${
                      f.color === "brand" ? "text-brand-600" : "text-violet-600"
                    }`}
                  />
                </div>
                <h3 className="font-semibold text-text mb-2">{f.title}</h3>
                <p className="text-sm text-text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo Storefront ─────────────────────────────────────────────── */}
      <section className="py-20 bg-surface" id="demo">
        <div className="page-container">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Votre boutique ressemblera à ça
            </h2>
            <p className="text-text-muted text-lg mb-12">
              Rapide, mobile-first, magnifique. Chargement en moins de 1.5s même en 3G.
            </p>
            <div className="card overflow-hidden">
              {/* Mock storefront preview */}
              <div className="bg-gradient-to-br from-violet-600 to-brand-600 p-8 text-white text-center">
                <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-1">Fatou Mode & Style</h3>
                <p className="text-white/70 text-sm">Mode et accessoires · Dakar, Mermoz</p>
                <div className="flex items-center justify-center gap-2 mt-3">
                  <div className="badge bg-white/20 text-white border-0">🟢 Ouvert</div>
                  <div className="badge bg-white/20 text-white border-0">🚚 Livraison disponible</div>
                </div>
              </div>
              <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { name: "Robe Bazin", price: 35000, tag: "Populaire" },
                  { name: "Tissu Wax 6m", price: 12000, tag: null },
                  { name: "Boubou Brodé", price: 55000, tag: "Promo" },
                ].map((p) => (
                  <div key={p.name} className="card-hover p-0 overflow-hidden">
                    <div className="h-28 bg-gradient-to-br from-surface-muted to-surface-border flex items-center justify-center">
                      <span className="text-3xl">👗</span>
                    </div>
                    <div className="p-3">
                      {p.tag && (
                        <span className="badge-brand text-2xs mb-1">{p.tag}</span>
                      )}
                      <p className="font-medium text-text text-sm truncate">{p.name}</p>
                      <p className="text-brand-600 font-bold text-sm">
                        {p.price.toLocaleString("fr-SN")} FCFA
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-surface-border">
                <button className="btn-whatsapp btn-lg w-full">
                  <MessageCircle className="w-5 h-5" />
                  Commander via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section className="py-20 bg-surface-subtle" id="tarifs">
        <div className="page-container">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-text mb-4">
              Tarifs simples et transparents
            </h2>
            <p className="text-text-muted text-lg">En FCFA · Sans engagement · Sans frais cachés</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`card card-body flex flex-col ${
                  plan.primary
                    ? "ring-2 ring-brand-500 shadow-glow scale-105"
                    : ""
                }`}
              >
                {plan.primary && (
                  <div className="badge-brand self-start mb-3">⭐ Populaire</div>
                )}
                <h3 className="font-bold text-xl text-text">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold text-text">
                    {plan.price === 0 ? "Gratuit" : `${plan.price.toLocaleString("fr-SN")} FCFA`}
                  </span>
                  {plan.price > 0 && (
                    <span className="text-text-muted text-sm ml-1">{plan.period}</span>
                  )}
                </div>
                <ul className="space-y-2 flex-1 mb-6">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-text-muted">
                      <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/auth/login"
                  className={`btn-md w-full justify-center ${
                    plan.primary ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Final ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-hero">
        <div className="page-container text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
            Rejoignez les commerçants qui vendent déjà en ligne avec Boutik.
          </p>
          <Link href="/auth/login" className="btn-primary btn-lg text-base">
            Créer ma boutique maintenant — C'est gratuit
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-white/50 py-10">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-brand flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-semibold">Boutik</span>
            <span className="text-white/30 text-sm">· Dakar, Sénégal</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} Boutik · Tous droits réservés
          </p>
        </div>
      </footer>
    </div>
  );
}
