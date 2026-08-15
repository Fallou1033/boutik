"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, MessageCircle } from "lucide-react";
import Image from "next/image";
import type { Store } from "@/types/database.types";
import { formatXOF, getImageUrl, cn } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";
import CheckoutForm from "./CheckoutForm";

interface Props {
  store: Store;
  onClose: () => void;
}

export default function CartDrawer({ store, onClose }: Props) {
  const [step, setStep] = useState<"cart" | "checkout">("cart");
  const { items, removeItem, updateQty, totalItems, totalPrice, clearCart } = useCart(store.id);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-surface h-full flex flex-col animate-slide-in-right shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <button
              onClick={step === "checkout" ? () => setStep("cart") : onClose}
              className="btn-ghost btn-sm p-1"
            >
              {step === "checkout" ? (
                <ArrowRight className="w-5 h-5 rotate-180" />
              ) : (
                <X className="w-5 h-5" />
              )}
            </button>
            <h2 className="font-semibold text-text">
              {step === "cart" ? `Mon panier (${totalItems})` : "Finaliser ma commande"}
            </h2>
          </div>
          {step === "cart" && items.length > 0 && (
            <button
              onClick={() => clearCart()}
              className="text-xs text-red-400 hover:text-red-600 transition-colors"
            >
              Vider
            </button>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto">
          {step === "cart" ? (
            <>
              {items.length === 0 ? (
                <div className="empty-state h-full">
                  <ShoppingBag className="w-12 h-12 text-text-subtle mb-3" />
                  <p className="font-medium">Votre panier est vide</p>
                  <p className="text-sm mt-1">Ajoutez des produits pour commander</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-border">
                  {items.map(({ product, quantity }) => {
                    const maxQty = product.track_stock ? (product.stock_quantity ?? 99) : 99;
                    return (
                      <div key={product.id} className="flex gap-3 p-4">
                        {/* Image */}
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-muted flex-shrink-0">
                          {product.images[0] ? (
                            <Image
                              src={getImageUrl(product.images[0], "thumb")}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ShoppingBag className="w-6 h-6 text-text-subtle" />
                            </div>
                          )}
                        </div>

                        {/* Détails */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-text text-sm leading-snug line-clamp-2">
                            {product.name}
                          </p>
                          <p className="text-brand-600 font-semibold text-sm mt-1">
                            {formatXOF(product.price)}
                          </p>

                          {/* Contrôles quantité */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQty(product.id, quantity - 1)}
                              className="w-7 h-7 rounded-full border border-surface-border flex items-center justify-center hover:bg-surface-muted transition-colors"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium tabular-nums">
                              {quantity}
                            </span>
                            <button
                              onClick={() => updateQty(product.id, Math.min(maxQty, quantity + 1))}
                              disabled={quantity >= maxQty}
                              className="w-7 h-7 rounded-full border border-surface-border flex items-center justify-center hover:bg-surface-muted transition-colors disabled:opacity-40"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Sous-total + Supprimer */}
                        <div className="flex flex-col items-end justify-between">
                          <button
                            onClick={() => removeItem(product.id)}
                            className="text-text-subtle hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <p className="font-bold text-text text-sm tabular-nums">
                            {formatXOF(product.price * quantity)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <CheckoutForm
              store={store}
              onSuccess={() => {
                clearCart();
                onClose();
              }}
            />
          )}
        </div>

        {/* Footer */}
        {step === "cart" && items.length > 0 && (
          <div className="border-t border-surface-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Sous-total</span>
              <span className="font-bold text-text text-lg tabular-nums">
                {formatXOF(totalPrice)}
              </span>
            </div>
            <p className="text-xs text-text-subtle">
              Frais de livraison calculés à l'étape suivante
            </p>
            <button
              onClick={() => setStep("checkout")}
              className="btn-primary btn-lg w-full"
            >
              Commander — {formatXOF(totalPrice)}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
