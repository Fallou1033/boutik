-- ============================================================
-- Migration 001: Extensions PostgreSQL requises
-- Exécuter dans : Supabase Dashboard → SQL Editor
-- ============================================================

-- UUID v4 generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Recherche full-text et trigram (similarité textuelle)
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Recherche sans accents (noms sénégalais : Thiès, Ziguinchor...)
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- Auto-update du champ updated_at
CREATE EXTENSION IF NOT EXISTS "moddatetime";
