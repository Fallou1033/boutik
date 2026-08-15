import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import StoreSettingsForm from "@/components/dashboard/StoreSettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: merchant } = await supabase
    .from("merchants").select("id").eq("auth_user_id", user.id).single();
  if (!merchant) redirect("/auth/login");

  const { data: store } = await supabase
    .from("stores").select("*")
    .eq("merchant_id", (merchant as { id: string }).id).single();
  if (!store) redirect("/onboarding");

  return (
    <StoreSettingsForm store={store as {
      id: string; slug: string; name: string; description: string | null;
      whatsapp_number: string; city: string; district: string | null;
      instagram_handle: string | null; tiktok_handle: string | null;
      accepts_delivery: boolean; is_active: boolean;
    }} />
  );
}
