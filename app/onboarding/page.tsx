"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Store, Phone, MapPin, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, DAKAR_DISTRICTS } from "@/lib/utils";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

const STEPS = [
  { id: 1, title: "Nom de la boutique", icon: Store },
  { id: 2, title: "Contact & Localisation", icon: Phone },
  { id: 3, title: "C'est parti !", icon: CheckCircle },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    whatsapp_number: "",
    city: "Dakar",
    district: "",
    instagram_handle: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((f) => {
      const update: typeof f = { ...f, [name]: value };
      if (name === "name") update.slug = slugify(value);
      return update;
    });
  };

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    let merchantId: string | null = null;
    const { data: merchant } = await supabase
      .from("merchants").select("id").eq("auth_user_id", user.id).single();

    if (merchant) {
      merchantId = (merchant as { id: string }).id;
    } else {
      // Auto-créer le profil marchand si absent
      const { data: newMerchant, error: mError } = await supabase
        .from("merchants")
        .insert({
          auth_user_id: user.id,
          full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Marchand",
          email: user.email ?? "",
          phone: form.whatsapp_number.replace(/\D/g, "") || "770000000",
        } as never)
        .select("id")
        .single();

      if (mError || !newMerchant) {
        console.error("Merchant creation error:", mError);
        setError("Erreur création profil marchand: " + (mError?.message ?? "Erreur inconnue"));
        setIsLoading(false);
        return;
      }
      merchantId = (newMerchant as { id: string }).id;
    }

    // Vérifier unicité du slug
    const { data: existing } = await supabase
      .from("stores").select("id").eq("slug", form.slug).single();

    if (existing) {
      setError("Ce nom de boutique est déjà pris. Essayez un autre.");
      setIsLoading(false);
      setStep(1);
      return;
    }

    const { error: createError } = await supabase.from("stores").insert({
      merchant_id:      merchantId,
      name:             form.name,
      slug:             form.slug,
      description:      form.description || null,
      whatsapp_number:  form.whatsapp_number.replace(/\D/g, ""),
      city:             form.city,
      district:         form.district || null,
      instagram_handle: form.instagram_handle || null,
    } as never);

    if (createError) {
      console.error("Store creation error:", createError);
      setError(createError.message);
      setIsLoading(false);
      return;
    }

    setStep(3);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand shadow-glow mb-4">
            <ShoppingBag className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Créez votre boutique</h1>
          <p className="text-white/50 text-sm mt-1">En moins de 2 minutes</p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {STEPS.slice(0, 2).map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                step >= s.id ? "bg-brand-500 text-white" : "bg-white/10 text-white/40"
              )}>
                {step > s.id ? "✓" : s.id}
              </div>
              {i < 1 && (
                <div className={cn(
                  "w-16 h-0.5 transition-all",
                  step > s.id ? "bg-brand-500" : "bg-white/10"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
          {error && <div className="alert-error mb-4">{error}</div>}

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-5 h-5 text-brand-400" />
                <h2 className="font-semibold text-white">Nom de votre boutique</h2>
              </div>

              <div>
                <label className="label text-white/80">Nom de la boutique <span className="text-red-400">*</span></label>
                <input
                  name="name" value={form.name} onChange={handleChange}
                  placeholder="Ex: Mode Dakar, Bijoux Fatou..."
                  className="input bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  maxLength={80}
                />
              </div>

              {form.slug && (
                <div>
                  <label className="label text-white/80">URL de votre boutique</label>
                  <div className="input bg-white/5 border-white/10 text-brand-400 text-sm">
                    boutik.app/<span className="font-bold">{form.slug}</span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    Vous pouvez changer le nom mais pas l'URL après la création.
                  </p>
                </div>
              )}

              <div>
                <label className="label text-white/80">Description (optionnel)</label>
                <textarea
                  name="description" value={form.description} onChange={handleChange}
                  placeholder="Vendez des robes en wax, accessoires, cosmétiques..."
                  className="input bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                  rows={2} maxLength={500}
                />
              </div>

              <button
                onClick={() => {
                  if (!form.name.trim() || !form.slug) {
                    setError("Veuillez saisir un nom de boutique.");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                className="btn-primary btn-lg w-full"
              >
                Continuer <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="w-5 h-5 text-brand-400" />
                <h2 className="font-semibold text-white">Contact & Localisation</h2>
              </div>

              <div>
                <label className="label text-white/80">Numéro WhatsApp <span className="text-red-400">*</span></label>
                <input
                  name="whatsapp_number" value={form.whatsapp_number} onChange={handleChange}
                  placeholder="77 123 45 67" type="tel" inputMode="tel"
                  className="input bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                <p className="text-xs text-white/40 mt-1">Les clients vous contacteront via ce numéro</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-white/80">Ville</label>
                  <input
                    name="city" value={form.city} onChange={handleChange}
                    className="input bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="label text-white/80">Quartier</label>
                  <input
                    name="district" value={form.district} onChange={handleChange}
                    list="districts-onboarding"
                    placeholder="Plateau, Mermoz..."
                    className="input bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <datalist id="districts-onboarding">
                    {DAKAR_DISTRICTS.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label className="label text-white/80">Instagram (optionnel)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">@</span>
                  <input
                    name="instagram_handle" value={form.instagram_handle} onChange={handleChange}
                    placeholder="ma_boutique"
                    className="input pl-8 bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary btn-lg flex-1">
                  Retour
                </button>
                <button
                  onClick={() => {
                    if (!form.whatsapp_number.trim()) {
                      setError("Veuillez saisir votre numéro WhatsApp.");
                      return;
                    }
                    setError(null);
                    handleCreate();
                  }}
                  disabled={isLoading}
                  className="btn-primary btn-lg flex-1"
                >
                  {isLoading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Création...</>
                  ) : (
                    <>Créer ma boutique 🚀</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — Succès */}
          {step === 3 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-brand-500/20 flex items-center justify-center mx-auto mb-4 animate-scale-in">
                <CheckCircle className="w-8 h-8 text-brand-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Boutique créée ! 🎉</h2>
              <p className="text-white/60 text-sm">
                Redirection vers votre tableau de bord...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
