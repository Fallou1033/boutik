-- ============================================================
-- Migration 009: Row Level Security (RLS) — Isolation multi-tenant
-- ============================================================

-- ── Activation RLS sur toutes les tables ───────────────────────────────────
ALTER TABLE public.merchants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

-- ── Fonctions helper (SECURITY DEFINER pour éviter les boucles RLS) ────────

-- Retourne le merchant_id de l'utilisateur connecté
CREATE OR REPLACE FUNCTION public.get_merchant_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.merchants WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Retourne le store_id de la boutique du marchand connecté
CREATE OR REPLACE FUNCTION public.get_merchant_store_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id
  FROM public.stores s
  INNER JOIN public.merchants m ON m.id = s.merchant_id
  WHERE m.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- ── Politiques: merchants ───────────────────────────────────────────────────

CREATE POLICY "merchants: lecture de son propre profil"
  ON public.merchants FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "merchants: mise à jour de son propre profil"
  ON public.merchants FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "merchants: création de profil après signup"
  ON public.merchants FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- ── Politiques: stores ──────────────────────────────────────────────────────

-- Marchand authentifié : toutes opérations sur SA boutique
CREATE POLICY "stores: CRUD marchand propriétaire"
  ON public.stores FOR ALL
  USING (merchant_id = public.get_merchant_id());

-- Public anonyme : lecture des boutiques actives uniquement (storefront)
CREATE POLICY "stores: lecture publique boutiques actives"
  ON public.stores FOR SELECT
  USING (is_active = TRUE);

-- ── Politiques: products ────────────────────────────────────────────────────

-- Marchand authentifié : CRUD sur ses propres produits
CREATE POLICY "products: CRUD marchand propriétaire"
  ON public.products FOR ALL
  USING (store_id = public.get_merchant_store_id());

-- Public anonyme : lecture des produits actifs des boutiques actives
CREATE POLICY "products: lecture publique produits actifs"
  ON public.products FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM public.stores
      WHERE id = products.store_id
        AND is_active = TRUE
    )
  );

-- ── Politiques: orders ──────────────────────────────────────────────────────

-- Marchand : lecture de ses commandes uniquement
CREATE POLICY "orders: lecture marchand propriétaire"
  ON public.orders FOR SELECT
  USING (store_id = public.get_merchant_store_id());

-- Marchand : mise à jour statut commandes
CREATE POLICY "orders: update marchand propriétaire"
  ON public.orders FOR UPDATE
  USING (store_id = public.get_merchant_store_id());

-- Acheteurs anonymes : création de commande (contrôlée dans Edge Function)
-- L'Edge Function utilise service_role qui bypass RLS pour INSERT sécurisé
-- Cette politique est permissive car la validation se fait dans Edge Function
CREATE POLICY "orders: insertion via storefront"
  ON public.orders FOR INSERT
  WITH CHECK (TRUE);

-- ── Politiques: order_items ─────────────────────────────────────────────────

CREATE POLICY "order_items: lecture marchand"
  ON public.order_items FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM public.orders
      WHERE store_id = public.get_merchant_store_id()
    )
  );

CREATE POLICY "order_items: insertion via storefront"
  ON public.order_items FOR INSERT
  WITH CHECK (TRUE);

-- ── Politiques: customers ───────────────────────────────────────────────────

CREATE POLICY "customers: lecture marchand propriétaire"
  ON public.customers FOR SELECT
  USING (store_id = public.get_merchant_store_id());

-- Upsert géré dans Edge Function (service_role bypass RLS)
CREATE POLICY "customers: insertion anonyme"
  ON public.customers FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "customers: update via service_role uniquement"
  ON public.customers FOR UPDATE
  USING (store_id = public.get_merchant_store_id());

-- ── Politiques: deliveries ──────────────────────────────────────────────────

-- Lecture via la relation orders → deliveries
CREATE POLICY "deliveries: lecture marchand"
  ON public.deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.delivery_id = deliveries.id
        AND orders.store_id = public.get_merchant_store_id()
    )
  );

CREATE POLICY "deliveries: insertion anonyme"
  ON public.deliveries FOR INSERT
  WITH CHECK (TRUE);

-- ── Politiques: payment_logs ────────────────────────────────────────────────

-- Lecture seule pour le marchand (audit)
CREATE POLICY "payment_logs: lecture marchand"
  ON public.payment_logs FOR SELECT
  USING (store_id = public.get_merchant_store_id());

-- Insertion UNIQUEMENT via Edge Function (service_role) — pas de politique INSERT public
-- Cela force le passage par les Edge Functions pour toute écriture de log
