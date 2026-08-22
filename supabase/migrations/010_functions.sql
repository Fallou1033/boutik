-- ============================================================
-- Migration 010: Fonctions PostgreSQL métier
-- ============================================================

-- ── Génération de référence commande ───────────────────────────────────────
-- H-2: Sérialisation atomique par boutique avec advisory lock + fallback anti-collision

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
  v_rand   TEXT;
BEGIN
  -- Verrou de transaction par boutique + date pour éviter les collisions concurrentes
  PERFORM pg_advisory_xact_lock(hashtext(p_store_id::TEXT || v_date));

  SELECT COUNT(*) + 1 INTO v_count
  FROM public.orders
  WHERE store_id = p_store_id
    AND DATE(created_at AT TIME ZONE 'Africa/Dakar') = CURRENT_DATE;

  v_ref := 'CMD-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0');

  -- Si la référence existe déjà (concurrence extrême), ajouter un suffixe aléatoire
  WHILE EXISTS (SELECT 1 FROM public.orders WHERE reference = v_ref) LOOP
    v_rand := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 3));
    v_count := v_count + 1;
    v_ref := 'CMD-' || v_date || '-' || LPAD(v_count::TEXT, 4, '0') || '-' || v_rand;
  END LOOP;

  RETURN v_ref;
END;
$$;

COMMENT ON FUNCTION public.generate_order_reference IS
  'Génère CMD-YYYYMMDD-XXXX basé sur le fuseau horaire Dakar (GMT+0) avec protection anti-collision';

-- ── Traitement atomique du paiement confirmé ───────────────────────────────
-- C-3 & H-3: SECURITY DEFINER avec SET search_path = public et gestion idempotente

CREATE OR REPLACE FUNCTION public.process_successful_payment(
  p_order_reference       TEXT,
  p_payment_provider_ref  TEXT,
  p_amount                NUMERIC,
  p_idempotency_key       TEXT,
  p_raw_payload           JSONB DEFAULT NULL
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
  v_order     RECORD;
BEGIN
  -- 1. Verrouillage pessimiste de la commande
  SELECT id, store_id, order_status, payment_status, total
  INTO v_order
  FROM public.orders
  WHERE reference = p_order_reference
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ORDER_NOT_FOUND: %', p_order_reference;
  END IF;

  -- Idempotency: si déjà payée, ne rien faire
  IF v_order.payment_status = 'paid' THEN
    RETURN;
  END IF;

  v_order_id := v_order.id;
  v_store_id := v_order.store_id;

  -- 2. Mise à jour de la commande
  UPDATE public.orders SET
    order_status            = 'paid',
    payment_status          = 'paid',
    payment_ref             = p_payment_provider_ref,
    paid_at                 = NOW(),
    webhook_received_at     = NOW(),
    webhook_idempotency_key = p_idempotency_key,
    updated_at              = NOW()
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

    -- Log si stock insuffisant
    IF v_item.stock_quantity < v_item.quantity THEN
      INSERT INTO public.payment_logs (
        order_id, store_id, event_type, provider,
        raw_payload, error_message, success
      ) VALUES (
        v_order_id, v_store_id, 'payment_confirmed', 'cinetpay',
        p_raw_payload,
        'Stock insuffisant pour produit ' || v_item.product_id::TEXT ||
        ' (demandé: ' || v_item.quantity || ', disponible: ' || v_item.stock_quantity || ')',
        TRUE
      );
    END IF;
  END LOOP;

  -- 4. Log du succès
  INSERT INTO public.payment_logs (
    order_id, store_id, event_type, provider,
    provider_ref, amount, currency, raw_payload, success
  ) VALUES (
    v_order_id, v_store_id, 'payment_confirmed', 'cinetpay',
    p_payment_provider_ref, p_amount, 'XOF', p_raw_payload, TRUE
  );

END;
$$;

COMMENT ON FUNCTION public.process_successful_payment IS
  'Transaction atomique: update order paid + décrémentation stock. Idempotent et sécurisé.';

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
