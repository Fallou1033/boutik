import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ProductForm from "@/components/dashboard/ProductForm";

interface Props { params: { id: string } }

export default async function EditProductPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: merchant } = await supabase
    .from("merchants").select("id").eq("auth_user_id", user.id).single();
  if (!merchant) redirect("/auth/login");

  const { data: store } = await supabase
    .from("stores").select("id")
    .eq("merchant_id", (merchant as { id: string }).id).single();
  if (!store) redirect("/onboarding");

  const { data: product } = await supabase
    .from("products").select("*")
    .eq("id", params.id)
    .eq("store_id", (store as { id: string }).id)
    .single();

  if (!product) notFound();

  const p = product as {
    id: string; name: string; description: string | null; price: number;
    compare_price: number | null; category: string | null; track_stock: boolean;
    stock_quantity: number | null; is_active: boolean; is_featured: boolean;
    display_order: number; images: string[];
  };

  return (
    <ProductForm
      storeId={(store as { id: string }).id}
      mode="edit"
      product={{
        ...p,
        description: p.description ?? undefined,
        category: p.category ?? undefined,
        compare_price: p.compare_price ?? undefined,
        stock_quantity: p.stock_quantity ?? undefined,
      }}
    />
  );
}
