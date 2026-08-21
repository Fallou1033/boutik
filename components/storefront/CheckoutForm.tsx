"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, MessageCircle, CheckCircle, MapPin, User, CreditCard } from "lucide-react";
import type { Store } from "@/types/database.types";
import { CheckoutFormSchema } from "@/shared/schemas";
import type { z } from "zod";
import { formatXOF, DAKAR_DISTRICTS, cn } from "@/lib/utils";
import { generateWhatsAppDeepLink as genWA } from "@/lib/whatsapp";
import { useCart } from "@/hooks/useCart";

// Use the inferred output type (after Zod transforms/defaults)
type CheckoutFormInput = z.output<typeof CheckoutFormSchema>;

interface Props {
  store: Store;
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { value: "wave",             label: "Wave",             emoji: "💙", desc: "Paiement instantané" },
  { value: "orange_money",     label: "Orange Money",     emoji: "🟠", desc: "Disponible 24h/24" },
  { value: "free_money",       label: "Free Money",       emoji: "🟢", desc: "Aucun frais" },
  { value: "cash_on_delivery", label: "À la livraison",   emoji: "💵", desc: "Paiement cash" },
] as const;

const DELIVERY_FEE = 1500; // FCFA — fixe MVP

export default function CheckoutForm({ store, onSuccess }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [orderDone, setOrderDone] = useState<{ reference: string; waLink: string } | null>(null);
  const { items, totalPrice, clearCart } = useCart(store.id);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<CheckoutFormInput, any, CheckoutFormInput>({
    resolver: zodResolver(CheckoutFormSchema) as any,
    defaultValues: {
      delivery_type: "home",
      city: "Dakar",
      payment_method: "wave",
    },
  });

  const deliveryType = watch("delivery_type");
  const paymentMethod = watch("payment_method");
  const deliveryFee = deliveryType === "pickup" ? 0 : DELIVERY_FEE;
  const total = totalPrice + deliveryFee;

  const onSubmit: SubmitHandler<CheckoutFormInput> = async (data) => {
    setIsLoading(true);
    setFormError(null);
    try {
      const res = await fetch("/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_id: store.id,
          items: items.map((i) => ({
            product_id: i.product.id,
            quantity: i.quantity,
          })),
          customer: {
            full_name: data.full_name,
            phone: data.phone,
          },
          delivery: {
            recipient_name: data.full_name,
            recipient_phone: data.phone,
            city: data.city,
            district: data.district,
            address_details: data.address_details,
            landmark: data.landmark,
            delivery_type: data.delivery_type,
            delivery_fee: deliveryFee,
          },
          payment_method: data.payment_method,
          customer_notes: data.customer_notes,
        }),
      });

      const resData = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(resData?.error || "Erreur lors de la création de la commande.");
      }

      const reference = resData.reference;

      // Vider le panier après création réussie
      clearCart();

      // Génération lien WhatsApp
      const waLink = genWA(store.whatsapp_number, {
        reference,
        storeName: store.name,
        items: items.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price,
        })),
        subtotal: totalPrice,
        deliveryFee,
        total,
        customerName: data.full_name,
        customerPhone: data.phone,
        district: data.district,
        landmark: data.landmark,
        paymentMethod: data.payment_method,
      });

      setOrderDone({ reference, waLink });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Une erreur est survenue. Veuillez réessayer.";
      setFormError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Confirmation
  if (orderDone) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-20 h-20 rounded-full bg-brand-100 flex items-center justify-center mb-4 animate-scale-in">
          <CheckCircle className="w-10 h-10 text-brand-500" />
        </div>
        <h3 className="text-xl font-bold text-text mb-1">Commande créée ! 🎉</h3>
        <p className="text-text-muted text-sm mb-2">Réf: <strong>{orderDone.reference}</strong></p>
        <p className="text-text-muted text-sm mb-8">
          Cliquez sur le bouton ci-dessous pour envoyer votre commande au vendeur via WhatsApp.
        </p>
        <a
          href={orderDone.waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp btn-lg w-full mb-3"
          onClick={onSuccess}
        >
          <MessageCircle className="w-5 h-5" />
          Envoyer sur WhatsApp
        </a>
        <p className="text-xs text-text-subtle">
          Votre commande sera confirmée après réception du message par le vendeur.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 space-y-6">
      {formError && (
        <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
          {formError}
        </div>
      )}

      {/* Résumé commande */}
      <div className="card card-body bg-surface-subtle">
        <p className="text-sm font-medium text-text mb-3">📋 Résumé</p>
        <div className="space-y-1.5 text-sm">
          {items.map((i) => (
            <div key={i.product.id} className="flex justify-between text-text-muted">
              <span className="truncate mr-2">{i.product.name} ×{i.quantity}</span>
              <span className="flex-shrink-0 tabular-nums">{formatXOF(i.product.price * i.quantity)}</span>
            </div>
          ))}
          <div className="divider my-2" />
          <div className="flex justify-between text-text-muted">
            <span>Sous-total</span>
            <span className="tabular-nums">{formatXOF(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-text-muted">
            <span>Livraison</span>
            <span className="tabular-nums">
              {deliveryType === "pickup" ? "Gratuit" : formatXOF(DELIVERY_FEE)}
            </span>
          </div>
          <div className="flex justify-between font-bold text-text text-base">
            <span>Total</span>
            <span className="tabular-nums text-brand-600">{formatXOF(total)}</span>
          </div>
        </div>
      </div>

      {/* Infos client */}
      <section>
        <h3 className="section-title flex items-center gap-2">
          <User className="w-4 h-4" /> Vos informations
        </h3>
        <div className="space-y-3">
          <div>
            <label className="label label-required">Nom complet</label>
            <input
              {...register("full_name")}
              className={cn("input", errors.full_name && "input-error")}
              placeholder="Fatou Diallo"
              autoComplete="name"
            />
            {errors.full_name && (
              <p className="field-error">{errors.full_name.message}</p>
            )}
          </div>
          <div>
            <label className="label label-required">Téléphone</label>
            <input
              {...register("phone")}
              className={cn("input", errors.phone && "input-error")}
              placeholder="77 123 45 67"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
            />
            {errors.phone && (
              <p className="field-error">{errors.phone.message}</p>
            )}
          </div>
        </div>
      </section>

      {/* Livraison */}
      <section>
        <h3 className="section-title flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Livraison
        </h3>

        {/* Type livraison */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { value: "home",   label: "🏠 À domicile", desc: `+${formatXOF(DELIVERY_FEE)}` },
            { value: "pickup", label: "🏪 Retrait",     desc: "Gratuit" },
          ].map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex flex-col items-center p-3 rounded-xl border-2 cursor-pointer transition-all",
                deliveryType === opt.value
                  ? "border-brand-500 bg-brand-50"
                  : "border-surface-border hover:border-brand-300"
              )}
            >
              <input
                {...register("delivery_type")}
                type="radio"
                value={opt.value}
                className="sr-only"
              />
              <span className="text-sm font-medium text-text">{opt.label}</span>
              <span className="text-xs text-text-muted">{opt.desc}</span>
            </label>
          ))}
        </div>

        {deliveryType === "home" && (
          <div className="space-y-3">
            <div>
              <label className="label label-required">Quartier</label>
              <input
                {...register("district")}
                list="districts-list"
                className={cn("input", errors.district && "input-error")}
                placeholder="Ex: Mermoz, Plateau, Almadies..."
              />
              <datalist id="districts-list">
                {DAKAR_DISTRICTS.map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              {errors.district && (
                <p className="field-error">{errors.district.message}</p>
              )}
            </div>
            <div>
              <label className="label">Adresse détaillée</label>
              <input
                {...register("address_details")}
                className="input"
                placeholder="Rue, numéro, immeuble..."
              />
            </div>
            <div>
              <label className="label">Point de repère</label>
              <input
                {...register("landmark")}
                className="input"
                placeholder="Ex: près de la mosquée, école..."
              />
            </div>
          </div>
        )}
      </section>

      {/* Paiement */}
      <section>
        <h3 className="section-title flex items-center gap-2">
          <CreditCard className="w-4 h-4" /> Mode de paiement
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_METHODS.map((pm) => (
            <label
              key={pm.value}
              className={cn(
                "flex flex-col p-3 rounded-xl border-2 cursor-pointer transition-all",
                paymentMethod === pm.value
                  ? "border-brand-500 bg-brand-50"
                  : "border-surface-border hover:border-brand-300"
              )}
            >
              <input
                {...register("payment_method")}
                type="radio"
                value={pm.value}
                className="sr-only"
              />
              <span className="text-lg">{pm.emoji}</span>
              <span className="text-sm font-medium text-text mt-1">{pm.label}</span>
              <span className="text-2xs text-text-muted">{pm.desc}</span>
            </label>
          ))}
        </div>
      </section>

      {/* Notes */}
      <div>
        <label className="label">Note pour le vendeur (optionnel)</label>
        <textarea
          {...register("customer_notes")}
          className="input resize-none"
          rows={2}
          placeholder="Taille, couleur, instructions spéciales..."
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary btn-lg w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Création en cours...
          </>
        ) : (
          <>
            <MessageCircle className="w-5 h-5" />
            Commander — {formatXOF(total)}
          </>
        )}
      </button>

      <p className="text-xs text-center text-text-subtle pb-4">
        Votre commande sera confirmée via WhatsApp par le vendeur.
      </p>
    </form>
  );
}
