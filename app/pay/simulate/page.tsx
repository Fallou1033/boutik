"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Smartphone, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SimulatePaymentPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = searchParams.get("ref");

  const [provider, setProvider] = useState<"wave" | "orange_money" | "free_money">("wave");
  const [phone, setPhone] = useState("77 123 45 67");
  const [loading, setLoading] = useState(false);

  if (!ref) {
    return <div className="p-8 text-center">Référence de commande manquante.</div>;
  }

  const handleSimulate = async (success: boolean) => {
    setLoading(true);
    const supabase = createClient();

    if (success) {
      // Simuler l'appel de process_successful_payment
      const idempotencyKey = `sim_${ref}_${Date.now()}`;
      const { error } = await supabase.rpc("process_successful_payment" as never, {
        p_order_reference:      ref,
        p_payment_provider_ref: `SIM-${provider.toUpperCase()}-${Date.now()}`,
        p_amount:               0,
        p_idempotency_key:      idempotencyKey,
        p_raw_payload:          { simulated: true, provider, phone },
      } as never);

      if (error) {
        console.error("Simulation error:", error);
      }
      router.push(`/pay/result?ref=${encodeURIComponent(ref)}&status=success`);
    } else {
      await supabase
        .from("orders")
        .update({ payment_status: "failed", order_status: "pending" } as never)
        .eq("reference", ref);

      router.push(`/pay/result?ref=${encodeURIComponent(ref)}&status=failed`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-2xl text-white">
        <div className="flex items-center gap-2 mb-6 bg-brand-500/10 border border-brand-500/20 px-3 py-1.5 rounded-full text-brand-400 text-xs font-semibold w-fit">
          <ShieldCheck className="w-4 h-4" /> Mode Simulation Local (Sandbox)
        </div>

        <h1 className="text-xl font-bold mb-1">Simulateur Mobile Money</h1>
        <p className="text-slate-400 text-sm mb-6">
          Commande <strong className="text-white">{ref}</strong>
        </p>

        {/* Choix opérateur */}
        <div className="space-y-3 mb-6">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Choisissez l'opérateur
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: "wave", name: "Wave", emoji: "💙", border: "border-blue-500 bg-blue-500/10" },
              { id: "orange_money", name: "OM", emoji: "🟠", border: "border-orange-500 bg-orange-500/10" },
              { id: "free_money", name: "Free", emoji: "🟢", border: "border-green-500 bg-green-500/10" },
            ].map((op) => (
              <button
                key={op.id}
                type="button"
                onClick={() => setProvider(op.id as any)}
                className={`p-3 rounded-2xl border text-center transition-all ${
                  provider === op.id ? op.border : "border-slate-700 bg-slate-800/50 hover:bg-slate-700/50"
                }`}
              >
                <span className="text-2xl block mb-1">{op.emoji}</span>
                <span className="text-xs font-semibold">{op.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Champ téléphone */}
        <div className="mb-6">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Numéro de téléphone test
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => handleSimulate(true)}
            disabled={loading}
            className="w-full py-3 bg-brand-500 hover:bg-brand-600 font-semibold rounded-xl text-white flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Simuler Succès du Paiement
              </>
            )}
          </button>

          <button
            onClick={() => handleSimulate(false)}
            disabled={loading}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 font-medium rounded-xl text-slate-300 flex items-center justify-center gap-2 text-sm transition"
          >
            <XCircle className="w-4 h-4 text-red-400" />
            Simuler Échec du Paiement
          </button>
        </div>
      </div>
    </div>
  );
}
