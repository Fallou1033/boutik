"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, ArrowLeft, Upload, X, Plus, Minus,
  Package, Star, Eye, EyeOff, Save
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
        <h2 className="font-semibold text-text mb-3">Photos du produit <span className="text-text-subtle font-normal text-sm">(max 5)</span></h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {images.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-surface-muted group">
              <Image src={url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(url, i)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 badge bg-black/60 text-white text-2xs">
                  Principal
                </span>
              )}
            </div>
          ))}
          {images.length < 5 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="aspect-square rounded-xl border-2 border-dashed border-surface-border hover:border-brand-400 flex flex-col items-center justify-center gap-1 transition-colors text-text-subtle hover:text-brand-500"
            >
              {uploadingImage ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  <span className="text-2xs">Ajouter</span>
                </>
              )}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />
        <p className="text-xs text-text-subtle mt-2">JPG, PNG, WebP · Max 5 Mo par image</p>
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
