import { z } from "zod";

// ── Validators réutilisables ────────────────────────────────────────────────

export const senegalPhoneSchema = z
  .string()
  .min(1, "Numéro requis")
  .transform((val) => val.replace(/[\s\-\.\(\)]/g, ""))
  .refine(
    (val) => {
      const digits = val.replace(/\D/g, "");
      return (
        (digits.length === 9 && /^(70|75|76|77|78|33)[0-9]{7}$/.test(digits)) ||
        (digits.length === 12 && /^221(70|75|76|77|78|33)[0-9]{7}$/.test(digits)) ||
        (digits.length >= 9 && digits.length <= 12)
      );
    },
    "Numéro de téléphone sénégalais invalide (ex: 77 123 45 67)"
  );

// ── Schéma: Création Produit ────────────────────────────────────────────────

export const CreateProductSchema = z
  .object({
    name: z
      .string()
      .min(1, "Nom du produit requis")
      .max(120, "Nom trop long (max 120 caractères)")
      .trim(),
    description: z.string().max(1000, "Description trop longue").optional(),
    price: z
      .number({ invalid_type_error: "Prix invalide" })
      .positive("Le prix doit être positif")
      .multipleOf(1, "Prix en nombre entier (FCFA)"),
    compare_price: z
      .number()
      .positive()
      .optional()
      .nullable(),
    track_stock: z.boolean().default(false),
    stock_quantity: z
      .number()
      .int()
      .min(0, "Stock ne peut pas être négatif")
      .optional()
      .nullable(),
    images: z
      .array(z.string().url())
      .max(5, "Maximum 5 images par produit")
      .default([]),
    category: z.string().max(60).optional().nullable(),
    tags: z.array(z.string().max(30)).max(10).default([]),
    is_active: z.boolean().default(true),
    is_featured: z.boolean().default(false),
    display_order: z.number().int().default(0),
  })
  .refine(
    (data) => !data.track_stock || data.stock_quantity !== undefined,
    {
      message: "Quantité en stock requise si le suivi est activé",
      path: ["stock_quantity"],
    }
  )
  .refine(
    (data) =>
      !data.compare_price || !data.price || data.compare_price > data.price,
    {
      message: "Le prix barré doit être supérieur au prix de vente",
      path: ["compare_price"],
    }
  );

export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = Partial<CreateProductInput>;

// ── Schéma: Checkout / Commande ─────────────────────────────────────────────

export const CheckoutFormSchema = z.object({
  // Informations acheteur
  full_name: z
    .string()
    .min(2, "Nom complet requis (min 2 caractères)")
    .max(100)
    .trim(),
  phone: senegalPhoneSchema,

  // Livraison
  delivery_type: z.enum(["home", "pickup"], {
    errorMap: () => ({ message: "Mode de livraison invalide" }),
  }),
  city: z.string().min(1).default("Dakar"),
  district: z
    .string()
    .min(2, "Quartier requis")
    .max(80)
    .trim(),
  address_details: z.string().max(300).optional(),
  landmark: z.string().max(200).optional(),

  // Paiement
  payment_method: z.enum(
    ["wave", "orange_money", "free_money", "cash_on_delivery"],
    { errorMap: () => ({ message: "Méthode de paiement invalide" }) }
  ),

  // Notes
  customer_notes: z.string().max(500).optional(),
});

export type CheckoutFormInput = z.infer<typeof CheckoutFormSchema>;

// ── Schéma: Création Boutique (Onboarding) ──────────────────────────────────

export const CreateStoreSchema = z.object({
  name: z
    .string()
    .min(2, "Nom de boutique requis")
    .max(80, "Nom trop long")
    .trim(),
  slug: z
    .string()
    .min(3, "Slug trop court (min 3 caractères)")
    .max(60, "Slug trop long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug invalide (minuscules, chiffres et tirets uniquement)"
    ),
  description: z.string().max(500).optional(),
  whatsapp_number: senegalPhoneSchema,
  city: z.string().min(1).default("Dakar"),
  district: z.string().max(80).optional(),
  address_details: z.string().max(300).optional(),
  instagram_handle: z.string().max(50).optional(),
  tiktok_handle: z.string().max(50).optional(),
  accepts_delivery: z.boolean().default(true),
});

export type CreateStoreInput = z.infer<typeof CreateStoreSchema>;

// ── Schéma: Profil Marchand ─────────────────────────────────────────────────

export const MerchantProfileSchema = z.object({
  full_name: z
    .string()
    .min(2, "Nom complet requis")
    .max(100)
    .trim(),
  email: z
    .string()
    .email("Adresse email invalide")
    .toLowerCase(),
  phone: senegalPhoneSchema,
});

export type MerchantProfileInput = z.infer<typeof MerchantProfileSchema>;

// ── Schéma: Mise à jour statut commande ────────────────────────────────────

export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "awaiting_payment",
    "paid",
    "preparing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
});

export type UpdateOrderStatusInput = z.infer<typeof UpdateOrderStatusSchema>;

// ── State Machine: Transitions valides ─────────────────────────────────────

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  pending:           ["awaiting_payment", "cancelled"],
  awaiting_payment:  ["paid", "cancelled"],
  paid:              ["preparing", "refunded"],
  preparing:         ["shipped"],
  shipped:           ["delivered"],
  delivered:         ["refunded"],
  cancelled:         [],
  refunded:          [],
};

export function isValidTransition(
  currentStatus: string,
  newStatus: string
): boolean {
  return VALID_ORDER_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}
