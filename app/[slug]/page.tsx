import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import StorefrontPage from "@/components/storefront/StorefrontPage";
import type { Store, Product } from "@/types/database.types";

// H-6/H-7: Next.js 15 — params et searchParams sont des Promises
interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ category?: string; q?: string }>;
}

// ISR: revalidation toutes les 60 secondes
export const revalidate = 60;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: store } = await supabase
    .from("stores")
    .select("name, description, logo_url")
    .eq("slug", slug)
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
  const { slug } = await params;
  const { category } = await searchParams;
  const supabase = await createClient();

  // Récupération boutique
  const { data: storeRaw } = await supabase
    .from("stores")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!storeRaw) notFound();

  const store = storeRaw as unknown as Store;

  // L-4: Une seule requête pour tous les produits (filtrage + catégories)
  // On récupère tous les produits actifs, puis on filtre côté serveur si nécessaire.
  const { data: allProductsRaw } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", store.id)
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("display_order", { ascending: true });

  const allProducts = (allProductsRaw ?? []) as unknown as Product[];

  // Extraire les catégories uniques depuis les résultats
  const categories = [
    ...new Set(
      allProducts
        .map((p) => (p as unknown as { category: string | null }).category)
        .filter(Boolean)
    ),
  ] as string[];

  // Filtrer par catégorie si demandé
  const products = category
    ? allProducts.filter(
        (p) => (p as unknown as { category: string | null }).category === category
      )
    : allProducts;

  return (
    <StorefrontPage
      store={store}
      products={products}
      categories={categories}
      activeCategory={category}
    />
  );
}
