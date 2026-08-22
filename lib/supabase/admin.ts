import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Client Supabase avec droits Service Role (accès privilégié, bypass RLS).
 * À utiliser UNIQUEMENT côté serveur pour :
 * - La création de commandes storefront (bypass RLS)
 * - Les webhooks de paiement (CinetPay)
 * - Les tâches de fond / cron
 *
 * NE JAMAIS exposer ce client ou sa clé côté navigateur.
 * Lève une erreur si SUPABASE_SERVICE_ROLE_KEY n'est pas configuré.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://amqxyvuehikiatutvcal.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "[createAdminClient] Aucun jeton Supabase (SERVICE_ROLE_KEY ou ANON_KEY) n'est configuré."
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn(
      "[createAdminClient] SUPABASE_SERVICE_ROLE_KEY n'est pas défini dans les variables d'environnement. " +
      "Utilisation de la clé publique ANON_KEY."
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}


