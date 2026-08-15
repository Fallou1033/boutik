-- ============================================================
-- Migration 011: pg_cron — Jobs de maintenance automatisés
-- Activer pg_cron dans: Supabase Dashboard → Extensions → pg_cron
-- ============================================================

-- ATTENTION: pg_cron nécessite l'extension activée dans le Dashboard Supabase
-- Dashboard → Database → Extensions → chercher "pg_cron" → Enable

-- ── Job 1: Annulation des commandes en timeout (toutes les 15 min) ─────────
-- Commandes en awaiting_payment depuis plus de 30 minutes → cancelled

SELECT cron.schedule(
  'boutik-cancel-timeout-orders',       -- Nom unique du job
  '*/15 * * * *',                        -- Toutes les 15 minutes
  $$
    UPDATE public.orders
    SET order_status = 'cancelled'
    WHERE order_status = 'awaiting_payment'
      AND created_at < NOW() - INTERVAL '30 minutes';
  $$
);

-- ── Job 2: Nettoyage des logs anciens (1 an) — 1er du mois à 03h00 ─────────
-- Conserve 12 mois de logs de paiement pour conformité réglementaire

SELECT cron.schedule(
  'boutik-cleanup-old-logs',
  '0 3 1 * *',                           -- 1er de chaque mois à 03h00
  $$
    -- Note: payment_logs est immuable (règle NO DELETE)
    -- Ce job peut être adapté pour archiver vers une table _archive
    -- Pour l'instant, juste un log de diagnostic
    INSERT INTO public.payment_logs (
      order_id, store_id, event_type, provider, raw_payload
    )
    SELECT
      (SELECT id FROM public.orders ORDER BY created_at DESC LIMIT 1),
      (SELECT id FROM public.stores ORDER BY created_at DESC LIMIT 1),
      'webhook_verified',
      'manual',
      jsonb_build_object(
        'job', 'monthly_maintenance',
        'timestamp', NOW(),
        'orders_count', (SELECT COUNT(*) FROM public.orders),
        'payment_logs_count', (SELECT COUNT(*) FROM public.payment_logs)
      )
    WHERE EXISTS (SELECT 1 FROM public.orders LIMIT 1)
      AND EXISTS (SELECT 1 FROM public.stores LIMIT 1);
  $$
);

-- ── Vérification des jobs actifs ───────────────────────────────────────────
-- Exécuter cette requête pour vérifier que les jobs sont bien enregistrés:
-- SELECT * FROM cron.job;
