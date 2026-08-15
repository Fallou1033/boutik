-- ============================================================
-- Migration 004: Table stores
-- Boutique publique — URL: /<slug>
-- ============================================================

CREATE TABLE public.stores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  merchant_id     UUID NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,

  -- Identité publique
  name            TEXT NOT NULL CHECK (length(name) BETWEEN 2 AND 80),
  slug            slug_format NOT NULL UNIQUE,
  description     TEXT CHECK (length(description) <= 500),
  logo_url        TEXT,
  banner_url      TEXT,

  -- Contact & Localisation
  whatsapp_number phone_sn NOT NULL,
  city            TEXT NOT NULL DEFAULT 'Dakar',
  district        TEXT,
  address_details TEXT,

  -- Réseaux sociaux
  instagram_handle TEXT CHECK (length(instagram_handle) <= 50),
  tiktok_handle    TEXT CHECK (length(tiktok_handle) <= 50),

  -- Configuration boutique
  currency        currency_code NOT NULL DEFAULT 'XOF',
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  accepts_delivery BOOLEAN NOT NULL DEFAULT TRUE,

  -- Limite produits (dénormalisé depuis plan merchant pour perf)
  max_products    SMALLINT NOT NULL DEFAULT 10,

  -- Métadonnées
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON public.stores
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Index
CREATE UNIQUE INDEX idx_stores_slug     ON public.stores(slug);
CREATE INDEX        idx_stores_merchant ON public.stores(merchant_id);
CREATE INDEX        idx_stores_active   ON public.stores(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE public.stores IS 'Boutiques publiques — accessibles via /<slug>';
COMMENT ON COLUMN public.stores.max_products IS 'free=10, starter=50, pro=-1 (illimité)';
