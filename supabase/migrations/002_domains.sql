-- ============================================================
-- Migration 002: Domaines personnalisés PostgreSQL
-- Validation native en base de données (défense en profondeur)
-- ============================================================

-- Format téléphone sénégalais
-- Accepte: 771234567 | +221771234567 | 00221771234567
CREATE DOMAIN phone_sn AS TEXT
  CHECK (VALUE ~ '^(\+221|00221)?[0-9]{9}$');

-- Format slug URL-safe (lettres minuscules, chiffres, tirets)
CREATE DOMAIN slug_format AS TEXT
  CHECK (
    VALUE ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
    AND length(VALUE) BETWEEN 3 AND 60
  );

-- Prix positif (jusqu'à 99 999 999 FCFA)
CREATE DOMAIN positive_price AS NUMERIC(10,2)
  CHECK (VALUE >= 0);

-- Code devise supporté
CREATE DOMAIN currency_code AS TEXT
  CHECK (VALUE IN ('XOF', 'EUR', 'USD'));
