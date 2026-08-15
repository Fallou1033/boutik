import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StorefrontPage from "@/components/storefront/StorefrontPage";
import type { Store, Product } from "@/types/database.types";

interface Props {
  params: { slug: string };
  searchParams: { category?: string; q?: string };
}

// ISR: revalidation toutes les 60 secondes
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name, description, logo_url")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!store) return { title: "Boutique introuvable" };

  const s = store as unknown as Pick<Store, "name" | "description" | "logo_url">;

  return {
    title: s.name,
    description: s.description ?? `Découvrez les produits de ${s.name}`,
    openGraph: {
      title: s.name,
      description: s.description ?? "",
      images: s.logo_url ? [s.logo_url] : [],
    },
  };
}

export default async function Page({ params, searchParams }: Props) {
  const supabase = await createClient();

  // Récupération boutique
  const { data: storeRaw } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single();

  if (!storeRaw) notFound();

  const store = storeRaw as unknown as Store;

  // Récupération produits
  let query = supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true });

  if (searchParams.category) {
    query = query.eq("category", searchParams.category);
  }

  const { data: productsRaw } = await query;
  const products = (productsRaw ?? []) as unknown as Product[];

  // Catégories uniques
  const { data: allProductsRaw } = await supabase
    .from("products")
    .select("category")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .not("category", "is", null);

  const allProds = (allProductsRaw ?? []) as Array<{ category: string | null }>;
  const categories = [
    ...new Set(allProds.map((p) => p.category).filter(Boolean)),
  ] as string[];

  return (
    <StorefrontPage
      store={store}
      products={products}
      categories={categories}
      activeCategory={searchParams.category}
    />
  );
}
