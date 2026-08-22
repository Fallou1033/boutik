-- ══════════════════════════════════════════════════════════════════════════════
-- Migration 015 — Paiement Mobile Money & RLS (Phase 5)
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Ajouter webhook_idempotency_key à la table orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS webhook_idempotency_key TEXT UNIQUE;

-- 2. Ajouter payment_provider_ref (référence CinetPay)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_provider_ref TEXT;

-- 3. Ajouter payment_date
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_date TIMESTAMPTZ;

-- 4. Enrichir payment_logs avec raw_payload et error_message
ALTER TABLE public.payment_logs
  ADD COLUMN IF NOT EXISTS event_type TEXT,
  ADD COLUMN IF NOT EXISTS raw_payload JSONB,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- 5. Créer/remplacer la fonction process_successful_payment (avec search_path)
CREATE OR REPLACE FUNCTION public.process_successful_payment(
  p_order_reference      TEXT,
  p_payment_provider_ref TEXT,
  p_amount               NUMERIC,
  p_idempotency_key      TEXT,
  p_raw_payload          JSONB DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id   UUID;
  v_store_id   UUID;
  v_order      RECORD;
BEGIN
  -- Récupérer la commande
  SELECT id, store_id, order_status, payment_status, total
  INTO v_order
  FROM public.orders
  WHERE reference = p_order_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_reference;
  END IF;

  -- Idempotency: si déjà traitée, ne rien faire
  IF v_order.payment_status = 'paid' THEN
    RETURN;
  END IF;

  -- Mettre à jour la commande
  UPDATE public.orders SET
    payment_status          = 'paid',
    order_status            = 'paid',
    payment_provider_ref    = p_payment_provider_ref,
    payment_date            = NOW(),
    webhook_idempotency_key = p_idempotency_key,
    updated_at              = NOW()
  WHERE reference = p_order_reference;

  -- Décrémenter le stock pour chaque ligne de commande
  UPDATE public.products p
  SET stock_quantity = GREATEST(0, p.stock_quantity - oi.quantity)
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id
    AND oi.product_id = p.id
    AND p.track_stock = TRUE
    AND p.stock_quantity IS NOT NULL;

  -- Journaliser la confirmation
  INSERT INTO public.payment_logs (
    order_id, store_id, event_type, provider,
    amount, currency, success, raw_payload
  ) VALUES (
    v_order.id, v_order.store_id, 'payment_confirmed', 'cinetpay',
    p_amount, 'XOF', TRUE, p_raw_payload
  );

END;
$$;

-- 6. Politique RLS pour payment_logs (lecture par le marchand)
DROP POLICY IF EXISTS "payment_logs_merchant_select" ON public.payment_logs;
CREATE POLICY "payment_logs_merchant_select"
  ON public.payment_logs FOR SELECT
  USING (
    store_id IN (
      SELECT s.id FROM public.stores s
      JOIN public.merchants m ON s.merchant_id = m.id
      WHERE m.auth_user_id = auth.uid()
    )
  );

-- 7. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_orders_reference ON public.orders(reference);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON public.payment_logs(order_id);
