"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  ShoppingBag, MessageCircle, MapPin, Instagram,
  Search, X, Star, ChevronRight, Phone
} from "lucide-react";
import type { Store, Product } from "@/types/database.types";
import { formatXOF, getImageUrl, truncate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import ProductModal from "./ProductModal";
import CartDrawer from "./CartDrawer";
import { useCart } from "@/hooks/useCart";

interface Props {
  store: Store;
  products: Product[];
  categories: string[];
  activeCategory?: string;
}

export default function StorefrontPage({ store, products, categories, activeCategory }: Props) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activecat, setActivecat] = useState(activeCategory ?? "");

  const { items, addItem, totalItems, totalPrice } = useCart(store.id);

  // Filtrage côté client (instantané)
  const filtered = useMemo(() => {
    let result = products;
    if (activecat) result = result.filter((p) => p.category === activecat);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, activecat, search]);

  const featured = filtered.filter((p) => p.is_featured);
  const regular = filtered.filter((p) => !p.is_featured);

  return (
    <div className="min-h-screen bg-surface-subtle">
      {/* ── Header Boutique ─────────────────────────────────────────────── */}
      <header className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 text-white">
        {/* Banner */}
        {store.banner_url && (
          <div className="absolute inset-0 opacity-20">
            <Image src={store.banner_url} alt="" fill className="object-cover" />
          </div>
        )}

        <div className="relative page-container py-8">
          <div className="flex items-start gap-4">
            {/* Logo */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-white/30">
              {store.logo_url ? (
                <Image
                  src={getImageUrl(store.logo_url, "thumb")}
                  alt={store.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <ShoppingBag className="w-10 h-10 text-white/80" />
              )}
            </div>

            {/* Infos */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white leading-tight">{store.name}</h1>
              {store.description && (
                <p className="text-white/70 text-sm mt-1 leading-relaxed">
                  {truncate(store.description, 120)}
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {store.city && (
                  <span className="flex items-center gap-1 text-white/60 text-xs">
                    <MapPin className="w-3 h-3" />
                    {store.city}{store.district ? `, ${store.district}` : ""}
                  </span>
                )}
                {store.instagram_handle && (
                  <a
                    href={`https://instagram.com/${store.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-pink-300 text-xs hover:text-pink-200"
                  >
                    <Instagram className="w-3 h-3" />
                    @{store.instagram_handle}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="flex gap-4 mt-6 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-xl font-bold text-white">{products.length}</p>
              <p className="text-white/50 text-xs">Produits</p>
            </div>
            <div className="w-px bg-white/10" />
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-brand-400 animate-pulse-soft" />
              <span className="text-white/70 text-sm">Ouvert</span>
            </div>
            {store.accepts_delivery && (
              <>
                <div className="w-px bg-white/10" />
                <span className="text-white/70 text-sm">🚚 Livraison disponible</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Barre de recherche + Filtres ────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-surface border-b border-surface-border shadow-sm">
        <div className="page-container py-3 space-y-3">
          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-subtle" />
            <input
              type="search"
              placeholder={`Rechercher dans ${store.name}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 pr-10"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Catégories */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
              <button
                onClick={() => setActivecat("")}
                className={cn(
                  "badge flex-shrink-0 cursor-pointer transition-colors",
                  activecat === "" ? "badge-brand" : "badge-gray hover:badge-brand"
                )}
              >
                Tous
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActivecat(activecat === cat ? "" : cat)}
                  className={cn(
                    "badge flex-shrink-0 cursor-pointer transition-colors",
                    activecat === cat ? "badge-brand" : "badge-gray hover:badge-brand"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Contenu principal ────────────────────────────────────────────── */}
      <main className="page-container py-6 pb-32">
        {/* Produits vedettes */}
        {featured.length > 0 && !search && !activecat && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <h2 className="section-title mb-0">Coups de cœur</h2>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {featured.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                  onAddToCart={() => addItem(product, 1)}
                  featured
                />
              ))}
            </div>
          </section>
        )}

        {/* Tous les produits */}
        <section>
          {(search || activecat) && (
            <p className="text-sm text-text-muted mb-4">
              {filtered.length} produit{filtered.length !== 1 ? "s" : ""}
              {activecat ? ` dans "${activecat}"` : ""}
              {search ? ` pour "${search}"` : ""}
            </p>
          )}

          {filtered.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag className="w-12 h-12 text-text-subtle mb-3" />
              <p className="font-medium">Aucun produit trouvé</p>
              <p className="text-sm mt-1">Essayez une autre recherche ou catégorie</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(search || activecat ? filtered : regular).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                  onAddToCart={() => addItem(product, 1)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ── Barre de commande sticky ─────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-surface-border p-4 safe-bottom">
        <div className="max-w-2xl mx-auto flex gap-3">
          {totalItems > 0 ? (
            <button
              onClick={() => setCartOpen(true)}
              className="btn-primary btn-lg flex-1 justify-between"
            >
              <span className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Mon panier ({totalItems})
              </span>
              <span>{formatXOF(totalPrice)}</span>
            </button>
          ) : (
            <a
              href={`https://wa.me/${store.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp btn-lg flex-1"
            >
              <MessageCircle className="w-5 h-5" />
              Contacter {store.name}
            </a>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(qty) => {
            addItem(selectedProduct, qty);
            setSelectedProduct(null);
          }}
        />
      )}

      {cartOpen && (
        <CartDrawer
          store={store}
          onClose={() => setCartOpen(false)}
        />
      )}
    </div>
  );
}

// ── ProductCard Component ──────────────────────────────────────────────────
function ProductCard({
  product,
  onClick,
  onAddToCart,
  featured = false,
}: {
  product: Product;
  onClick: () => void;
  onAddToCart: () => void;
  featured?: boolean;
}) {
  const isOutOfStock = product.track_stock && (product.stock_quantity ?? 0) === 0;
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_price!) * 100)
    : 0;

  return (
    <div
      className={cn(
        "card overflow-hidden group cursor-pointer transition-all duration-200",
        "hover:shadow-card-hover hover:-translate-y-0.5",
        isOutOfStock && "opacity-60"
      )}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-square bg-surface-muted overflow-hidden">
        {product.images[0] ? (
          <Image
            src={getImageUrl(product.images[0], "medium")}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-text-subtle" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {featured && (
            <span className="badge bg-amber-400 text-amber-900 text-2xs">⭐ Vedette</span>
          )}
          {hasDiscount && (
            <span className="badge bg-red-500 text-white text-2xs">-{discountPct}%</span>
          )}
          {isOutOfStock && (
            <span className="badge bg-slate-700 text-white text-2xs">Épuisé</span>
          )}
        </div>
      </div>

      {/* Infos */}
      <div className="p-3">
        <p className="font-medium text-text text-sm leading-snug line-clamp-2">
          {product.name}
        </p>
        {product.category && (
          <p className="text-2xs text-text-subtle mt-0.5">{product.category}</p>
        )}
        <div className="flex items-center justify-between mt-2">
          <div>
            <p className="price text-brand-600 text-sm">{formatXOF(product.price)}</p>
            {hasDiscount && (
              <p className="price-compare text-2xs">{formatXOF(product.compare_price!)}</p>
            )}
          </div>
          {!isOutOfStock && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
              className="w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600 flex items-center justify-center text-white transition-colors shadow-sm"
              aria-label="Ajouter au panier"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
