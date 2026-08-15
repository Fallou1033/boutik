"use client";

import { useState, useEffect, useCallback } from "react";
import type { Product } from "@/types/database.types";

export interface CartItem {
  product: Product;
  quantity: number;
}

const getKey = (storeId: string) => `boutik_cart_${storeId}`;

function loadCart(storeId: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getKey(storeId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(storeId: string, items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getKey(storeId), JSON.stringify(items));
}

/**
 * useCart — Gestion du panier local (localStorage) par boutique.
 * Pas de dépendance externe, fonctionne offline (3G).
 */
export function useCart(storeId: string) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Chargement initial depuis localStorage
  useEffect(() => {
    setItems(loadCart(storeId));
  }, [storeId]);

  // Persist à chaque changement
  useEffect(() => {
    saveCart(storeId, items);
  }, [storeId, items]);

  const addItem = useCallback((product: Product, qty: number) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        const maxQty = product.track_stock ? (product.stock_quantity ?? 99) : 99;
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(maxQty, i.quantity + qty) }
            : i
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
    } else {
      setItems((prev) =>
        prev.map((i) => (i.product.id === productId ? { ...i, quantity: qty } : i))
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    saveCart(storeId, []);
  }, [storeId]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return { items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice };
}
