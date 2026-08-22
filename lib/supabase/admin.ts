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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("[createAdminClient] NEXT_PUBLIC_SUPABASE_URL is not defined");
  }
  if (!key) {
    throw new Error(
      "[createAdminClient] SUPABASE_SERVICE_ROLE_KEY is not defined. " +
      "Add it to your environment variables (Vercel → Settings → Environment Variables)."
    );
  }

  return createSupabaseClient<Database>(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

