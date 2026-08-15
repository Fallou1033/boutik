-- ============================================================
-- Migration 006: Tables customers & deliveries
-- ============================================================

-- ── customers ──────────────────────────────────────────────────────────────
-- Acheteurs anonymes (pas de compte requis pour commander)
-- Identifiés par téléphone dans le scope d'une boutique

CREATE TABLE public.customers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  full_name       TEXT NOT NULL CHECK (length(full_name) BETWEEN 2 AND 100),
  phone           phone_sn NOT NULL,

  -- Localisation habituelle (mémorisée pour commandes futures)
  preferred_city     TEXT,
  preferred_district TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un client est unique par téléphone dans une boutique
  CONSTRAINT customers_store_phone_unique UNIQUE (store_id, phone)
);

CREATE TRIGGER customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

CREATE INDEX idx_customers_store ON public.customers(store_id);
CREATE INDEX idx_customers_phone ON public.customers(store_id, phone);

COMMENT ON TABLE public.customers IS 'Acheteurs anonymes — pas d''auth requise pour commander';

-- ── deliveries ─────────────────────────────────────────────────────────────
-- Détails de livraison pour une commande spécifique
-- Séparé de orders pour flexibilité (click & collect vs livraison à domicile)

CREATE TABLE public.deliveries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Snapshot destinataire (immuable après création)
  recipient_name  TEXT NOT NULL CHECK (length(recipient_name) BETWEEN 2 AND 100),
  recipient_phone phone_sn NOT NULL,

  -- Adresse
  city            TEXT NOT NULL DEFAULT 'Dakar',
  district        TEXT NOT NULL,
  address_details TEXT CHECK (length(address_details) <= 300),
  landmark        TEXT CHECK (length(landmark) <= 200),

  -- Mode & Frais
  delivery_type   TEXT NOT NULL DEFAULT 'home'
                    CHECK (delivery_type IN ('home', 'pickup')),
  delivery_fee    positive_price NOT NULL DEFAULT 0,

  -- Statut logistique
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN (
                      'pending', 'assigned', 'in_transit',
                      'delivered', 'failed', 'returned'
                    )),
  notes           TEXT CHECK (length(notes) <= 500),

  -- Timestamps
  estimated_at    TIMESTAMPTZ,
  delivered_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER deliveries_updated_at
  BEFORE UPDATE ON public.deliveries
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

COMMENT ON TABLE public.deliveries IS 'Détails livraison — snapshot immuable de l''adresse au moment de la commande';
