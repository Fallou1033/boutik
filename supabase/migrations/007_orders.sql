-- ============================================================
-- Migration 007: Tables orders & order_items
-- State machine commande + lignes de commande (snapshot prix)
-- ============================================================

-- ── orders ─────────────────────────────────────────────────────────────────

CREATE TABLE public.orders (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE RESTRICT,
  customer_id     UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  delivery_id     UUID REFERENCES public.deliveries(id) ON DELETE SET NULL,

  -- Référence humaine lisible (CMD-YYYYMMDD-XXXX)
  reference       TEXT NOT NULL UNIQUE,

  -- Statut commande (state machine)
  order_status    TEXT NOT NULL DEFAULT 'pending'
                    CHECK (order_status IN (
                      'pending',
                      'awaiting_payment',
                      'paid',
                      'preparing',
                      'shipped',
                      'delivered',
                      'cancelled',
                      'refunded'
                    )),

  -- Statut paiement (découplé du statut commande)
  payment_status  TEXT NOT NULL DEFAULT 'unpaid'
                    CHECK (payment_status IN (
                      'unpaid',
                      'pending',
                      'paid',
                      'failed',
                      'refunded'
                    )),

  -- Totaux (snapshot immuable)
  subtotal        positive_price NOT NULL,
  delivery_fee    positive_price NOT NULL DEFAULT 0,
  total           positive_price NOT NULL,
  currency        currency_code NOT NULL DEFAULT 'XOF',

  -- Paiement
  payment_method  TEXT CHECK (payment_method IN (
                    'wave', 'orange_money', 'free_money', 'cash_on_delivery'
                  )),
  payment_ref     TEXT UNIQUE,
  paid_at         TIMESTAMPTZ,

  -- Idempotence webhook
  webhook_received_at     TIMESTAMPTZ,
  webhook_idempotency_key TEXT UNIQUE,

  -- Notes client
  customer_notes  TEXT CHECK (length(customer_notes) <= 500),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte: total = subtotal + delivery_fee
  CONSTRAINT total_must_equal_subtotal_plus_fee
    CHECK (total = subtotal + delivery_fee)
);

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Index de performance
CREATE INDEX idx_orders_store          ON public.orders(store_id);
CREATE INDEX idx_orders_customer       ON public.orders(customer_id);
CREATE INDEX idx_orders_status         ON public.orders(store_id, order_status);
CREATE INDEX idx_orders_payment_status ON public.orders(store_id, payment_status);
CREATE INDEX idx_orders_reference      ON public.orders(reference);
CREATE INDEX idx_orders_payment_ref    ON public.orders(payment_ref);
CREATE INDEX idx_orders_created        ON public.orders(store_id, created_at DESC);

-- Index partiel: commandes en attente de paiement (pour le cron de timeout)
CREATE INDEX idx_orders_awaiting_payment
  ON public.orders(created_at)
  WHERE order_status = 'awaiting_payment';

COMMENT ON TABLE public.orders IS 'Commandes — state machine: pending→awaiting_payment→paid→preparing→shipped→delivered';
COMMENT ON COLUMN public.orders.webhook_idempotency_key IS 'Clé d''idempotence pour éviter le double-traitement des webhooks';

-- ── order_items ────────────────────────────────────────────────────────────
-- Snapshot des produits au moment de la commande (immuable)

CREATE TABLE public.order_items (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id        UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES public.products(id) ON DELETE SET NULL,

  -- Snapshot produit (immuable — prix au moment de la commande)
  product_name    TEXT NOT NULL,
  product_image   TEXT,
  unit_price      positive_price NOT NULL,
  quantity        SMALLINT NOT NULL CHECK (quantity > 0),
  line_total      positive_price NOT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contrainte: line_total = quantity × unit_price
  CONSTRAINT line_total_coherence
    CHECK (line_total = quantity * unit_price)
);

CREATE INDEX idx_order_items_order   ON public.order_items(order_id);
CREATE INDEX idx_order_items_product ON public.order_items(product_id);

COMMENT ON TABLE public.order_items IS 'Lignes de commande — snapshot prix immuable au moment de la commande';
