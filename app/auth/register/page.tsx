"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Mail, Lock, Eye, EyeOff, User, Phone, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "verify">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");

  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", password: "", confirm: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (form.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    // 1. Créer le compte Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name, phone: form.phone },
      },
    });

    if (authError) {
      setError(
        authError.message.includes("already registered")
          ? "Un compte existe déjà avec cet email."
          : authError.message
      );
      setIsLoading(false);
      return;
    }

    // 2. Créer le profil marchand
    if (authData.user) {
      await supabase.from("merchants").insert({
        auth_user_id: authData.user.id,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone.replace(/\D/g, ""),
      } as never);
    }

    setEmail(form.email);
    setStep("verify");
    setIsLoading(false);
  };

  if (step === "verify") {
    return (
      <div className="animate-fade-in text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-500/20 mb-6">
          <CheckCircle className="w-8 h-8 text-brand-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Vérifiez votre email !</h1>
        <p className="text-white/60 mb-6">
          Un lien de confirmation a été envoyé à <strong className="text-white">{email}</strong>.
          Cliquez sur le lien pour activer votre compte.
        </p>
        <Link href="/auth/login" className="btn-primary btn-md inline-flex">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-brand shadow-glow mb-4">
          <ShoppingBag className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">Créer votre boutique</h1>
        <p className="text-white/50 text-sm mt-1">Gratuit · Aucune carte bancaire requise</p>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-2xl">
        {error && <div className="alert-error mb-4">{error}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="label text-white/80">Nom complet</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                name="full_name" value={form.full_name} onChange={handleChange}
                placeholder="Fatou Diallo" required
                className="input pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="label text-white/80">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                name="email" type="email" value={form.email} onChange={handleChange}
                placeholder="fatou@exemple.com" required autoComplete="email"
                className="input pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="label text-white/80">Téléphone (WhatsApp)</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="77 123 45 67" required
                className="input pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="label text-white/80">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                name="password" type={showPassword ? "text" : "password"}
                value={form.password} onChange={handleChange}
                placeholder="Min. 8 caractères" required
                className="input pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-brand-500 focus:border-brand-500"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="label text-white/80">Confirmer le mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                name="confirm" type="password" value={form.confirm} onChange={handleChange}
                placeholder="••••••••" required
                className="input pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary btn-lg w-full mt-2">
            {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Création...</> : "Créer mon compte gratuit"}
          </button>
        </form>

        <div className="divider my-5" />
        <p className="text-center text-sm text-white/50">
          Déjà un compte ?{" "}
          <Link href="/auth/login" className="text-brand-400 hover:text-brand-300 font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}
