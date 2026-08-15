-- ============================================================
-- Migration 010: Fonctions PostgreSQL métier
-- ============================================================

-- ── Génération de référence commande ───────────────────────────────────────

CREATE OR REPLACE FUNCTION public.generate_order_reference(p_store_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date   TEXT := TO_CHAR(NOW() AT TIME ZONE 'Africa/Dakar', 'YYYYMMDD');
  v_count  INTEGER;
  v_ref    TEXT;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM public.orders
  WHERE store_id = p_store_id
    AND DATE(created_at AT TIME ZONE 'Africa/Dakar') = CURRENT_DATE;

  v_ref := 'CMD-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0');
  RETURN v_ref;
END;
$$;

COMMENT ON FUNCTION public.generate_order_reference IS
  'Génère CMD-YYYYMMDD-XXXX basé sur le fuseau horaire Dakar (GMT+0)';

-- ── Traitement atomique du paiement confirmé ───────────────────────────────
-- CRITIQUE: Appelé depuis Edge Function payment-webhook après vérif HMAC
-- Utilise SELECT FOR UPDATE pour éviter les race conditions

CREATE OR REPLACE FUNCTION public.process_successful_payment(
  p_order_reference       TEXT,
  p_payment_provider_ref  TEXT,
  p_amount                NUMERIC,
  p_idempotency_key       TEXT,
  p_raw_payload           JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id  UUID;
  v_store_id  UUID;
  v_item      RECORD;
  v_updated   INTEGER;
BEGIN
  -- 1. Verrouillage pessimiste (évite race conditions avec webhooks simultanés)
  SELECT id, store_id INTO v_order_id, v_store_id
  FROM public.orders
  WHERE reference = p_order_reference
    AND order_status = 'awaiting_payment'
  FOR UPDATE NOWAIT;  -- Échoue immédiatement si déjà verrouillé

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND_OR_INVALID_STATE: %', p_order_reference;
  END IF;

  -- 2. Mise à jour de la commande
  UPDATE public.orders SET
    order_status            = 'paid',
    payment_status          = 'paid',
    payment_ref             = p_payment_provider_ref,
    paid_at                 = NOW(),
    webhook_received_at     = NOW(),
    webhook_idempotency_key = p_idempotency_key
  WHERE id = v_order_id;

  -- 3. Décrémentation stock atomique (uniquement si track_stock = TRUE)
  FOR v_item IN
    SELECT oi.product_id, oi.quantity, p.stock_quantity
    FROM public.order_items oi
    INNER JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = v_order_id
      AND p.track_stock = TRUE
      AND p.stock_quantity IS NOT NULL
  LOOP
    UPDATE public.products
    SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity)
    WHERE id = v_item.product_id;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    -- Log si stock insuffisant (edge case: stock épuisé entre création et paiement)
    IF v_item.stock_quantity < v_item.quantity THEN
      INSERT INTO public.payment_logs (
        order_id, store_id, event_type, provider,
        raw_payload, error_message, success
      ) VALUES (
        v_order_id, v_store_id, 'payment_confirmed', 'cinetpay',
        p_raw_payload,
        'Stock insuffisant pour produit ' || v_item.product_id::TEXT ||
        ' (demandé: ' || v_item.quantity || ', disponible: ' || v_item.stock_quantity || ')',
        TRUE  -- La commande est quand même payée — vendeur gère manuellement
      );
    END IF;
  END LOOP;

  -- 4. Log du succès (toujours en dernier)
  INSERT INTO public.payment_logs (
    order_id, store_id, event_type, provider,
    provider_ref, amount, currency, raw_payload, success
  ) VALUES (
    v_order_id, v_store_id, 'payment_confirmed', 'cinetpay',
    p_payment_provider_ref, p_amount, 'XOF', p_raw_payload, TRUE
  );

  -- COMMIT implicite si pas d'exception
END;
$$;

COMMENT ON FUNCTION public.process_successful_payment IS
  'Transaction atomique: update order paid + décrémentation stock. Appelé depuis Edge Function après vérif HMAC.';

-- ── Vérification transition commande valide ────────────────────────────────

CREATE OR REPLACE FUNCTION public.is_valid_order_transition(
  p_current_status TEXT,
  p_new_status     TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT p_new_status = ANY(
    CASE p_current_status
      WHEN 'pending'          THEN ARRAY['awaiting_payment', 'cancelled']
      WHEN 'awaiting_payment' THEN ARRAY['paid', 'cancelled']
      WHEN 'paid'             THEN ARRAY['preparing', 'refunded']
      WHEN 'preparing'        THEN ARRAY['shipped']
      WHEN 'shipped'          THEN ARRAY['delivered']
      WHEN 'delivered'        THEN ARRAY['refunded']
      ELSE ARRAY[]::TEXT[]
    END
  );
$$;

COMMENT ON FUNCTION public.is_valid_order_transition IS
  'Valide les transitions de statut commande selon la state machine métier';
