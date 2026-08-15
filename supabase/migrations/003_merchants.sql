-- ============================================================
-- Migration 003: Table merchants
-- Un compte marchand = 1 utilisateur Supabase Auth
-- ============================================================

CREATE TABLE public.merchants (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Informations personnelles
  full_name       TEXT NOT NULL CHECK (length(full_name) BETWEEN 2 AND 100),
  email           TEXT NOT NULL UNIQUE
                    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z]{2,}$'),
  phone           phone_sn NOT NULL UNIQUE,

  -- Abonnement
  plan            TEXT NOT NULL DEFAULT 'free'
                    CHECK (plan IN ('free', 'starter', 'pro')),
  plan_expires_at TIMESTAMPTZ,

  -- Métadonnées
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE TRIGGER merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);

-- Index
CREATE INDEX idx_merchants_auth_user ON public.merchants(auth_user_id);
CREATE INDEX idx_merchants_email     ON public.merchants(email);

-- Commentaires
COMMENT ON TABLE public.merchants IS 'Comptes marchands Boutik — 1 merchant = 1 Supabase Auth user';
COMMENT ON COLUMN public.merchants.plan IS 'free=10 produits, starter=50, pro=illimité';
