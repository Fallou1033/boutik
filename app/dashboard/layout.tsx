import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // Récupérer le marchand
  const { data: merchantRaw } = await supabase
    .from("merchants")
    .select("id")
    .eq("auth_user_id", user.id)
    .single();

  const merchant = merchantRaw as { id: string } | null;

  // Vérifier si le marchand a une boutique
  const { data: store } = await supabase
    .from("stores")
    .select("id, slug, name")
    .eq("merchant_id", merchant?.id ?? "")
    .single();

  return (
    <DashboardShell user={user} store={store as { id: string; slug: string; name: string } | null}>
      {children}
    </DashboardShell>
  );
}
