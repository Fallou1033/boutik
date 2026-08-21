-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 012 — Renforcement de la sécurité (Security Hardening)
-- À exécuter dans Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Révoquer les droits d'exécution publics sur process_successful_payment
-- Seuls service_role et postgres peuvent valider un paiement atomique
REVOKE EXECUTE ON FUNCTION public.process_successful_payment(TEXT, TEXT, NUMERIC, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.process_successful_payment(TEXT, TEXT, NUMERIC, TEXT, JSONB) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_successful_payment(TEXT, TEXT, NUMERIC, TEXT, JSONB) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.process_successful_payment(TEXT, TEXT, NUMERIC, TEXT, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.process_successful_payment(TEXT, TEXT, NUMERIC, TEXT, JSONB) TO postgres;

-- 2. Index de performance et sécurité pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_customers_store_phone ON public.customers(store_id, phone);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_store_id ON public.payment_logs(store_id);

-- 3. Politique RLS pour insertion des payment_logs par service_role / postgres
DROP POLICY IF EXISTS "payment_logs_service_insert" ON public.payment_logs;
CREATE POLICY "payment_logs_service_insert"
  ON public.payment_logs FOR INSERT
  WITH CHECK (true);

