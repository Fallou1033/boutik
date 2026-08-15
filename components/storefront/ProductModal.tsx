"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Minus, Plus, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/types/database.types";
import { formatXOF, getImageUrl, cn } from "@/lib/utils";

interface Props {
  product: Product;
  onClose: () => void;
  onAddToCart: (qty: number) => void;
}

export default function ProductModal({ product, onClose, onAddToCart }: Props) {
  const [qty, setQty] = useState(1);
  const [imgIndex, setImgIndex] = useState(0);

  const isOutOfStock = product.track_stock && (product.stock_quantity ?? 0) === 0;
  const maxQty = product.track_stock ? (product.stock_quantity ?? 99) : 99;
  const hasDiscount = product.compare_price && product.compare_price > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compare_price!) * 100)
    : 0;

  const images = product.images.length > 0 ? product.images : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-2xl overflow-hidden animate-slide-up shadow-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Images */}
        <div className="relative aspect-square bg-surface-muted">
          {images.length > 0 ? (
            <>
              <Image
                src={getImageUrl(images[imgIndex], "large")}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
              {/* Navigation images */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIndex((i) => Math.max(0, i - 1))}
                    disabled={imgIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center disabled:opacity-30 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setImgIndex((i) => Math.min(images.length - 1, i + 1))}
                    disabled={imgIndex === images.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center disabled:opacity-30 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIndex(i)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          i === imgIndex ? "bg-white w-4" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-text-subtle" />
            </div>
          )}

          {/* Badges overlay */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_featured && (
              <span className="badge bg-amber-400 text-amber-900">⭐ Coup de cœur</span>
            )}
            {hasDiscount && (
              <span className="badge bg-red-500 text-white">-{discountPct}% de réduction</span>
            )}
            {isOutOfStock && (
              <span className="badge bg-slate-700 text-white">Épuisé</span>
            )}
          </div>
        </div>

        {/* Miniatures */}
        {images.length > 1 && (
          <div className="flex gap-2 px-4 pt-3 overflow-x-auto scrollbar-none">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setImgIndex(i)}
                className={cn(
                  "w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition",
                  i === imgIndex ? "border-brand-500" : "border-transparent opacity-60"
                )}
              >
                <Image
                  src={getImageUrl(img, "thumb")}
                  alt=""
                  width={56}
                  height={56}
                  className="object-cover w-full h-full"
                />
              </button>
            ))}
          </div>
        )}

        {/* Détails */}
        <div className="p-5">
          {product.category && (
            <p className="text-xs text-text-subtle uppercase tracking-wide mb-1">
              {product.category}
            </p>
          )}
          <h2 className="text-xl font-bold text-text">{product.name}</h2>

          {/* Prix */}
          <div className="flex items-baseline gap-3 mt-2">
            <span className="text-2xl font-bold text-brand-600">{formatXOF(product.price)}</span>
            {hasDiscount && (
              <span className="price-compare text-base">{formatXOF(product.compare_price!)}</span>
            )}
          </div>

          {/* Stock */}
          {product.track_stock && product.stock_quantity !== null && (
            <p className={cn(
              "text-sm mt-1",
              product.stock_quantity <= 3 ? "text-red-500 font-medium" : "text-text-muted"
            )}>
              {product.stock_quantity === 0
                ? "Épuisé"
                : product.stock_quantity <= 3
                ? `⚠️ Plus que ${product.stock_quantity} en stock !`
                : `${product.stock_quantity} disponibles`}
            </p>
          )}

          {/* Description */}
          {product.description && (
            <p className="text-text-muted text-sm leading-relaxed mt-3 border-t border-surface-border pt-3">
              {product.description}
            </p>
          )}

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {product.tags.map((tag) => (
                <span key={tag} className="badge-gray text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Footer — Quantité + Ajouter */}
        {!isOutOfStock && (
          <div className="p-5 pt-0 flex gap-3">
            {/* Sélecteur quantité */}
            <div className="flex items-center gap-2 border border-surface-border rounded-lg px-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-8 h-10 flex items-center justify-center text-text-muted hover:text-text"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-semibold text-text tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                className="w-8 h-10 flex items-center justify-center text-text-muted hover:text-text"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Ajouter au panier */}
            <button
              onClick={() => onAddToCart(qty)}
              className="btn-primary btn-lg flex-1"
            >
              <ShoppingBag className="w-5 h-5" />
              Ajouter — {formatXOF(product.price * qty)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
