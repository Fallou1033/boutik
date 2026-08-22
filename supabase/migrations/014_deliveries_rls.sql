-- ============================================================
-- Migration 014: RLS fix pour les tables storefront
-- ============================================================

-- 1. Deliveries : INSERT et SELECT pour storefront
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "deliveries: insertion anonyme" ON public.deliveries;
CREATE POLICY "deliveries: insertion anonyme"
  ON public.deliveries FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "deliveries: lecture storefront" ON public.deliveries;
CREATE POLICY "deliveries: lecture storefront"
  ON public.deliveries FOR SELECT
  TO anon, authenticated, service_role
  USING (TRUE);

-- 2. Orders : INSERT et SELECT par référence pour storefront
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "orders: insertion via storefront" ON public.orders;
CREATE POLICY "orders: insertion via storefront"
  ON public.orders FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "orders: lecture storefront par reference" ON public.orders;
CREATE POLICY "orders: lecture storefront par reference"
  ON public.orders FOR SELECT
  TO anon, authenticated, service_role
  USING (TRUE);

-- 3. Order Items : INSERT et SELECT pour storefront
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_items: insertion via storefront" ON public.order_items;
CREATE POLICY "order_items: insertion via storefront"
  ON public.order_items FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "order_items: lecture storefront" ON public.order_items;
CREATE POLICY "order_items: lecture storefront"
  ON public.order_items FOR SELECT
  TO anon, authenticated, service_role
  USING (TRUE);

-- 4. Customers : INSERT et SELECT (évite les conflits RLS lors de la recherche client par téléphone)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customers: insertion anonyme" ON public.customers;
CREATE POLICY "customers: insertion anonyme"
  ON public.customers FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "customers: select storefront" ON public.customers;
CREATE POLICY "customers: select storefront"
  ON public.customers FOR SELECT
  TO anon, authenticated, service_role
  USING (TRUE);
