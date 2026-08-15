import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Package, Edit, Eye, EyeOff, Star } from "lucide-react";
import { formatXOF, getImageUrl } from "@/lib/utils";
import Image from "next/image";

export default async function ProductsPage() {
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

  const { data: productsRaw } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeData.id)
    .order("display_order", { ascending: true });

  const products = (productsRaw ?? []) as Array<{
    id: string; name: string; price: number; compare_price: number | null;
    images: string[]; category: string | null; is_active: boolean;
    is_featured: boolean; stock_quantity: number | null; track_stock: boolean;
  }>;

  const canAddMore = products.length < storeData.max_products;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Produits</h1>
          <p className="text-text-muted text-sm mt-1">
            {products.length} / {storeData.max_products} produits
          </p>
        </div>
        {canAddMore ? (
          <Link href="/dashboard/products/new" className="btn-primary btn-md">
            <Plus className="w-4 h-4" /> Ajouter
          </Link>
        ) : (
          <div className="badge-yellow text-sm px-3 py-1.5">
            Limite atteinte — Passez au plan Pro
          </div>
        )}
      </div>

      {/* Liste produits */}
      {products.length === 0 ? (
        <div className="card">
          <div className="empty-state py-16">
            <Package className="w-14 h-14 text-text-subtle mb-4" />
            <p className="text-lg font-semibold text-text">Aucun produit</p>
            <p className="text-text-muted text-sm mt-1 mb-6">
              Commencez par ajouter vos premiers produits à vendre.
            </p>
            <Link href="/dashboard/products/new" className="btn-primary btn-md">
              <Plus className="w-4 h-4" /> Ajouter mon 1er produit
            </Link>
          </div>
        </div>
      ) : (
        <div className="card divide-y divide-surface-border">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-surface-subtle transition-colors">
              {/* Image */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-muted flex-shrink-0">
                {product.images[0] ? (
                  <Image
                    src={getImageUrl(product.images[0], "thumb")}
                    alt={product.name}
                    width={56} height={56}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-text-subtle" />
                  </div>
                )}
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-text text-sm truncate">{product.name}</p>
                  {product.is_featured && (
                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0" />
                  )}
                  {!product.is_active && (
                    <span className="badge-gray text-2xs">Masqué</span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-semibold text-brand-600 text-sm tabular-nums">
                    {formatXOF(product.price)}
                  </span>
                  {product.category && (
                    <span className="text-text-subtle text-xs">{product.category}</span>
                  )}
                  {product.track_stock && (
                    <span className={`text-xs ${(product.stock_quantity ?? 0) <= 3 ? "text-red-500" : "text-text-muted"}`}>
                      Stock: {product.stock_quantity ?? 0}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/dashboard/products/${product.id}/edit`}
                  className="btn-ghost btn-sm p-2"
                  title="Modifier"
                >
                  <Edit className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
