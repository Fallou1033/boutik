"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, ArrowLeft, Upload, X, Plus, Minus,
  Package, Star, Eye, EyeOff, Save,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn, formatXOF } from "@/lib/utils";

const ProductSchema = z.object({
  name:          z.string().min(1, "Nom requis").max(120),
  description:   z.string().max(1000).optional(),
  price:         z.coerce.number().min(0, "Prix requis"),
  compare_price: z.coerce.number().min(0).optional().nullable(),
  category:      z.string().max(60).optional(),
  track_stock:   z.boolean().default(false),
  stock_quantity: z.coerce.number().int().min(0).optional().nullable(),
  is_active:     z.boolean().default(true),
  is_featured:   z.boolean().default(false),
  display_order: z.coerce.number().int().default(0),
});

type ProductFormData = z.infer<typeof ProductSchema>;

interface Props {
  storeId: string;
  product?: ProductFormData & { id: string; images: string[] };
  mode: "create" | "edit";
}

export default function ProductForm({ storeId, product, mode }: Props) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema) as any,
    defaultValues: product ?? {
      is_active: true,
      is_featured: false,
      track_stock: false,
      display_order: 0,
    },
  });

  const trackStock = watch("track_stock");
  const price = watch("price");
  const isActive = watch("is_active");
  const isFeatured = watch("is_featured");

  // Upload image vers Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (images.length + files.length > 5) {
      alert("Maximum 5 images par produit");
      return;
    }

    setUploadingImage(true);
    const supabase = createClient();

    try {
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} dépasse 5 Mo`);
          continue;
        }
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${storeId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { data, error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (error) {
          console.error("Storage upload error:", error);
          alert(`Erreur d'upload pour ${file.name} : ${error.message}`);
        } else if (data) {
          const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(data.path);
          setImages((prev) => [...prev, urlData.publicUrl]);
        }
      }
    } catch (err: unknown) {
      console.error("Upload catch error:", err);
      const msg = err instanceof Error ? err.message : "Erreur inattendue";
      alert(`Erreur lors de l'envoi de l'image : ${msg}`);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = async (url: string, index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Réorganisation des images ──────────────────────────────────────────
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const moveImageLeft = (index: number) => {
    if (index <= 0) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const moveImageRight = (index: number) => {
    if (index >= images.length - 1) return;
    setImages((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
  };

  const setAsPrimary = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const item = prev[index];
      const rest = prev.filter((_, i) => i !== index);
      return [item, ...rest];
    });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    setImages((prev) => {
      const next = [...prev];
      const [movedItem] = next.splice(draggedIndex, 1);
      next.splice(targetIndex, 0, movedItem);
      return next;
    });
    setDraggedIndex(null);
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const payload = {
      ...data,
      store_id: storeId,
      images,
      tags: [],
      compare_price: data.compare_price || null,
      stock_quantity: data.track_stock ? data.stock_quantity : null,
    };

    if (mode === "create") {
      const { error } = await supabase.from("products").insert(payload as never);
      if (error) { setError(error.message); setIsLoading(false); return; }
    } else {
      const { error } = await supabase.from("products")
        .update(payload as never).eq("id", product!.id);
      if (error) { setError(error.message); setIsLoading(false); return; }
    }

    router.push("/dashboard/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard/products" className="btn-ghost btn-sm p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-text">
            {mode === "create" ? "Nouveau produit" : "Modifier le produit"}
          </h1>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => setValue("is_active", !isActive)}
            className={cn("btn-sm gap-2", isActive ? "btn-secondary" : "btn-ghost")}
          >
            {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            {isActive ? "Visible" : "Masqué"}
          </button>
          <button
            type="button"
            onClick={() => setValue("is_featured", !isFeatured)}
            className={cn("btn-sm gap-2", isFeatured ? "btn-secondary" : "btn-ghost")}
          >
            <Star className={cn("w-4 h-4", isFeatured && "fill-amber-400 text-amber-400")} />
            Vedette
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {/* Images */}
      <div className="card card-body">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-text">
            Photos du produit <span className="text-text-subtle font-normal text-sm">(max 5)</span>
          </h2>
          {images.length > 1 && (
            <span className="text-xs text-brand-600 font-medium">
              Glissez ou cliquez sur ⭐ pour changer la photo principale
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {images.map((url, i) => (
            <div
              key={url + i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(i)}
              className={cn(
                "relative aspect-square rounded-xl overflow-hidden bg-surface-muted group border-2 transition-all cursor-grab active:cursor-grabbing",
                i === 0 ? "border-brand-500 shadow-md ring-2 ring-brand-500/20" : "border-surface-border hover:border-brand-300",
                draggedIndex === i && "opacity-50 scale-95"
              )}
            >
              <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover" />

              {/* Badge Principal */}
              {i === 0 && (
                <span className="absolute top-1.5 left-1.5 badge bg-brand-500 text-white text-2xs shadow-sm font-semibold flex items-center gap-1 z-10">
                  <Star className="w-2.5 h-2.5 fill-white" />
                  Principale
                </span>
              )}

              {/* Bouton de suppression (toujours accessible) */}
              <button
                type="button"
                onClick={() => removeImage(url, i)}
                title="Supprimer la photo"
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500/90 hover:bg-red-600 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Barre de contrôle de réordonnancement */}
              <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  type="button"
                  onClick={() => moveImageLeft(i)}
                  disabled={i === 0}
                  title="Déplacer vers la gauche"
                  className={cn(
                    "w-6 h-6 rounded-md bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-xs transition",
                    i === 0 && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setAsPrimary(i)}
                    title="Mettre en photo principale"
                    className="px-1.5 py-0.5 rounded bg-brand-500 hover:bg-brand-600 text-white text-2xs font-semibold flex items-center gap-0.5 shadow-sm transition"
                  >
                    <Star className="w-2.5 h-2.5 fill-white" />
                    1ère
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => moveImageRight(i)}
                  disabled={i === images.length - 1}
                  title="Déplacer vers la droite"
                  className={cn(
                    "w-6 h-6 rounded-md bg-white/20 hover:bg-white/40 text-white flex items-center justify-center text-xs transition",
                    i === images.length - 1 && "opacity-30 cursor-not-allowed"
                  )}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="aspect-square rounded-xl border-2 border-dashed border-surface-border hover:border-brand-400 flex flex-col items-center justify-center gap-1 transition-colors text-text-subtle hover:text-brand-500 bg-surface-subtle/50"
            >
              {uploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-2xs font-medium">Ajouter</span>
                </>
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-text-subtle mt-2">
          JPG, PNG, WebP · Max 5 Mo par image. La 1ère photo (marquée &quot;Principale&quot;) est celle qui apparaît en couverture sur votre boutique.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>

      {/* Informations principales */}
      <div className="card card-body space-y-4">
        <h2 className="font-semibold text-text">Informations</h2>

        <div>
          <label className="label label-required">Nom du produit</label>
          <input {...register("name")} className={cn("input", errors.name && "input-error")}
            placeholder="Ex: Robe en wax Dakar" />
          {errors.name && <p className="field-error">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label">Description</label>
          <textarea {...register("description")} className="input resize-none" rows={3}
            placeholder="Décrivez votre produit (matière, taille, couleurs disponibles...)" />
        </div>

        <div>
          <label className="label">Catégorie</label>
          <input {...register("category")} className="input"
            placeholder="Ex: Vêtements, Bijoux, Cosmétiques..." />
        </div>
      </div>

      {/* Prix */}
      <div className="card card-body space-y-4">
        <h2 className="font-semibold text-text">Prix</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label label-required">Prix de vente (FCFA)</label>
            <input {...register("price")} type="number" inputMode="numeric"
              className={cn("input tabular-nums", errors.price && "input-error")}
              placeholder="15000" />
            {errors.price && <p className="field-error">{errors.price.message}</p>}
            {price > 0 && (
              <p className="text-xs text-text-muted mt-1">{formatXOF(price)}</p>
            )}
          </div>
          <div>
            <label className="label">Prix barré (optionnel)</label>
            <input {...register("compare_price")} type="number" inputMode="numeric"
              className="input tabular-nums"
              placeholder="20000" />
            <p className="text-xs text-text-subtle mt-1">Affiche une réduction</p>
          </div>
        </div>
      </div>

      {/* Stock */}
      <div className="card card-body space-y-4">
        <h2 className="font-semibold text-text">Stock</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" {...register("track_stock")} className="checkbox" />
          <div>
            <p className="text-sm font-medium text-text">Suivre le stock</p>
            <p className="text-xs text-text-muted">Empêche les commandes si épuisé</p>
          </div>
        </label>
        {trackStock && (
          <div>
            <label className="label">Quantité disponible</label>
            <input {...register("stock_quantity")} type="number" inputMode="numeric"
              className="input w-32 tabular-nums" placeholder="10" min={0} />
          </div>
        )}
      </div>

      {/* Ordre d'affichage */}
      <div className="card card-body">
        <h2 className="font-semibold text-text mb-3">Ordre d'affichage</h2>
        <input {...register("display_order")} type="number" inputMode="numeric"
          className="input w-24 tabular-nums" />
        <p className="text-xs text-text-subtle mt-1">Les produits avec un numéro plus bas apparaissent en premier.</p>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pb-8">
        <Link href="/dashboard/products" className="btn-secondary btn-lg flex-1 justify-center">
          Annuler
        </Link>
        <button type="submit" disabled={isLoading} className="btn-primary btn-lg flex-1">
          {isLoading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
          ) : (
            <><Save className="w-5 h-5" /> {mode === "create" ? "Créer le produit" : "Enregistrer"}</>
          )}
        </button>
      </div>
    </form>
  );
}
