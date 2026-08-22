-- ============================================================
-- Migration 014: RLS fix pour les tables storefront
-- ============================================================

-- Permettre l''insertion publique pour les commandes storefront
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deliveries: insertion anonyme" ON public.deliveries;
CREATE POLICY "deliveries: insertion anonyme"
  ON public.deliveries FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (TRUE);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders: insertion via storefront" ON public.orders;
CREATE POLICY "orders: insertion via storefront"
  ON public.orders FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (TRUE);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items: insertion via storefront" ON public.order_items;
CREATE POLICY "order_items: insertion via storefront"
  ON public.order_items FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (TRUE);

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers: insertion anonyme" ON public.customers;
CREATE POLICY "customers: insertion anonyme"
  ON public.customers FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (TRUE);
