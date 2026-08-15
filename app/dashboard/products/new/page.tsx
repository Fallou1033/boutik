import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProductForm from "@/components/dashboard/ProductForm";

export default async function NewProductPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: merchant } = await supabase
    .from("merchants").select("id").eq("auth_user_id", user.id).single();
  if (!merchant) redirect("/auth/login");

  const { data: store } = await supabase
    .from("stores").select("id, max_products")
    .eq("merchant_id", (merchant as { id: string }).id).single();
  if (!store) redirect("/onboarding");

  const storeData = store as { id: string; max_products: number };

  const { count } = await supabase
    .from("products").select("*", { count: "exact", head: true })
    .eq("store_id", storeData.id);

  if ((count ?? 0) >= storeData.max_products) {
    redirect("/dashboard/products");
  }

  return <ProductForm storeId={storeData.id} mode="create" />;
}
