"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2, Save, Store, Globe, Phone, MessageCircle,
  Instagram, Copy, CheckCheck, ExternalLink
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { DAKAR_DISTRICTS } from "@/lib/utils";

const SettingsSchema = z.object({
  name:             z.string().min(2).max(80),
  description:      z.string().max(500).optional(),
  whatsapp_number:  z.string().min(9),
  city:             z.string().min(1),
  district:         z.string().optional(),
  instagram_handle: z.string().max(50).optional(),
  tiktok_handle:    z.string().max(50).optional(),
  accepts_delivery: z.boolean(),
  is_active:        z.boolean(),
});

type SettingsInput = z.infer<typeof SettingsSchema>;

interface Props {
  store: {
    id: string; slug: string; name: string; description: string | null;
    whatsapp_number: string; city: string; district: string | null;
    instagram_handle: string | null; tiktok_handle: string | null;
    accepts_delivery: boolean; is_active: boolean;
  };
}

export default function StoreSettingsForm({ store }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${store.slug}`;

  const { register, handleSubmit, formState: { errors } } = useForm<SettingsInput>({
    resolver: zodResolver(SettingsSchema) as any,
    defaultValues: {
      name:             store.name,
      description:      store.description ?? "",
      whatsapp_number:  store.whatsapp_number,
      city:             store.city,
      district:         store.district ?? "",
      instagram_handle: store.instagram_handle ?? "",
      tiktok_handle:    store.tiktok_handle ?? "",
      accepts_delivery: store.accepts_delivery,
      is_active:        store.is_active,
    },
  });

  const copyLink = async () => {
    await navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onSubmit = async (data: SettingsInput) => {
    setIsSaving(true);
    const supabase = createClient();
    await supabase.from("stores").update(data as never).eq("id", store.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    setIsSaving(false);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-text">Paramètres de la boutique</h1>

      {/* Lien boutique */}
      <div className="card card-body">
        <h2 className="font-semibold text-text mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-text-muted" /> Lien de votre boutique
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 input bg-surface-muted text-text-muted text-sm truncate flex items-center">
            {storeUrl}
          </div>
          <button onClick={copyLink} className={cn("btn-secondary btn-md gap-2", copied && "text-brand-600 border-brand-300")}>
            {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier"}
          </button>
          <a href={storeUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-md p-2">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Partage social */}
        <p className="text-xs font-medium text-text-muted mt-4 mb-2">Partager sur :</p>
        <div className="flex gap-2 flex-wrap">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`🛍️ Découvrez ma boutique en ligne : ${storeUrl}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-whatsapp btn-sm"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp
          </a>
          <a
            href={`https://www.instagram.com/`}
            target="_blank" rel="noopener noreferrer"
            className="btn-sm bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl gap-2 flex items-center px-3 py-2 hover:opacity-90"
          >
            <Instagram className="w-4 h-4" /> Instagram
          </a>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Infos générales */}
        <div className="card card-body space-y-4">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <Store className="w-4 h-4 text-text-muted" /> Informations générales
          </h2>

          <div>
            <label className="label label-required">Nom de la boutique</label>
            <input {...register("name")} className={cn("input", errors.name && "input-error")} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="label">Description</label>
            <textarea {...register("description")} className="input resize-none" rows={3}
              placeholder="Décrivez votre boutique en quelques mots..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Ville</label>
              <input {...register("city")} className="input" />
            </div>
            <div>
              <label className="label">Quartier</label>
              <input {...register("district")} list="districts" className="input" />
              <datalist id="districts">
                {DAKAR_DISTRICTS.map((d) => <option key={d} value={d} />)}
              </datalist>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card card-body space-y-4">
          <h2 className="font-semibold text-text flex items-center gap-2">
            <Phone className="w-4 h-4 text-text-muted" /> Contact & Réseaux sociaux
          </h2>

          <div>
            <label className="label label-required">Numéro WhatsApp</label>
            <input {...register("whatsapp_number")} className={cn("input", errors.whatsapp_number && "input-error")}
              placeholder="77 123 45 67" type="tel" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Instagram (@)</label>
              <input {...register("instagram_handle")} className="input" placeholder="ma_boutique" />
            </div>
            <div>
              <label className="label">TikTok (@)</label>
              <input {...register("tiktok_handle")} className="input" placeholder="ma_boutique" />
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="card card-body space-y-3">
          <h2 className="font-semibold text-text">Options</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("accepts_delivery")} className="checkbox" />
            <div>
              <p className="text-sm font-medium text-text">Accepter les livraisons</p>
              <p className="text-xs text-text-muted">Affiche l'option livraison sur votre boutique</p>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" {...register("is_active")} className="checkbox" />
            <div>
              <p className="text-sm font-medium text-text">Boutique active</p>
              <p className="text-xs text-text-muted">Désactivez temporairement votre boutique</p>
            </div>
          </label>
        </div>

        <button type="submit" disabled={isSaving} className="btn-primary btn-lg w-full">
          {isSaving ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
          ) : saved ? (
            <><CheckCheck className="w-5 h-5" /> Enregistré !</>
          ) : (
            <><Save className="w-5 h-5" /> Enregistrer les modifications</>
          )}
        </button>
      </form>
    </div>
  );
}
