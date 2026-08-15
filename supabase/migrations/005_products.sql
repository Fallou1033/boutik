-- ============================================================
-- Migration 005: Table products
-- Catalogue produit d'une boutique
-- ============================================================

CREATE TABLE public.products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,

  -- Informations produit
  name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  description     TEXT CHECK (length(description) <= 1000),
  price           positive_price NOT NULL,
  compare_price   positive_price,

  -- Stock
  track_stock     BOOLEAN NOT NULL DEFAULT FALSE,
  stock_quantity  INTEGER CHECK (stock_quantity >= 0),

  -- Médias (max 5 images)
  images          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Catégorisation
  category        TEXT CHECK (length(category) <= 60),
  tags            TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

  -- Statut
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  is_featured     BOOLEAN NOT NULL DEFAULT FALSE,

  -- SEO
  meta_description TEXT CHECK (length(meta_description) <= 160),

  -- Ordre d'affichage
  display_order   INTEGER NOT NULL DEFAULT 0,

  -- Métadonnées
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Contraintes logiques
  CONSTRAINT images_max_5
    CHECK (array_length(images, 1) IS NULL OR array_length(images, 1) <= 5),
  CONSTRAINT compare_price_gt_price
    CHECK (compare_price IS NULL OR compare_price > price)
);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Index de performance
CREATE INDEX idx_products_store    ON public.products(store_id);
CREATE INDEX idx_products_active   ON public.products(store_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_featured ON public.products(store_id, is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_category ON public.products(store_id, category);
CREATE INDEX idx_products_order    ON public.products(store_id, display_order);

-- Index full-text (recherche produit en français)
CREATE INDEX idx_products_fts ON public.products
  USING GIN (
    to_tsvector('french',
      name || ' ' || COALESCE(description, '') || ' ' || COALESCE(category, '')
    )
  );

-- Index trigram pour recherche ILIKE rapide
CREATE INDEX idx_products_name_trgm ON public.products
  USING GIN (name gin_trgm_ops);

COMMENT ON TABLE public.products IS 'Catalogue produits — images = URLs Supabase Storage';
