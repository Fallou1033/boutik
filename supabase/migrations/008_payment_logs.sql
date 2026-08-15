-- ============================================================
-- Migration 008: Table payment_logs
-- Journal d'audit IMMUABLE de tous les événements paiement
-- ============================================================

CREATE TABLE public.payment_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE RESTRICT,
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,

  -- Événement
  event_type      TEXT NOT NULL CHECK (event_type IN (
                    'payment_initiated',
                    'webhook_received',
                    'webhook_verified',
                    'webhook_failed_signature',
                    'webhook_duplicate',
                    'payment_confirmed',
                    'payment_failed',
                    'refund_initiated',
                    'refund_confirmed'
                  )),
  provider        TEXT NOT NULL CHECK (provider IN (
                    'wave', 'cinetpay', 'orange_money', 'manual'
                  )),

  -- Données brutes pour audit et debugging
  raw_payload     JSONB,
  provider_ref    TEXT,

  -- Montants
  amount          positive_price,
  currency        currency_code DEFAULT 'XOF',

  -- Résultat
  success         BOOLEAN,
  error_message   TEXT,

  -- Sécurité
  ip_address      INET,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX idx_payment_logs_order    ON public.payment_logs(order_id);
CREATE INDEX idx_payment_logs_store    ON public.payment_logs(store_id);
CREATE INDEX idx_payment_logs_provider ON public.payment_logs(provider, provider_ref);
CREATE INDEX idx_payment_logs_event    ON public.payment_logs(event_type, created_at DESC);

-- Index partiel: signatures invalides (monitoring fraude)
CREATE INDEX idx_payment_logs_failed_sig
  ON public.payment_logs(created_at DESC, ip_address)
  WHERE event_type = 'webhook_failed_signature';

-- ─────────────────────────────────────────────────────────────
-- RÈGLES D'IMMUTABILITÉ
-- Les logs de paiement ne peuvent jamais être modifiés ou supprimés.
-- Toute tentative est silencieusement ignorée.
-- ─────────────────────────────────────────────────────────────
CREATE RULE no_update_payment_logs AS
  ON UPDATE TO public.payment_logs DO INSTEAD NOTHING;

CREATE RULE no_delete_payment_logs AS
  ON DELETE TO public.payment_logs DO INSTEAD NOTHING;

COMMENT ON TABLE public.payment_logs IS
  'Journal d''audit IMMUABLE — NE JAMAIS modifier ou supprimer ces enregistrements';
