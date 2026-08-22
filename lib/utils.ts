import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn — Fusion de classes Tailwind avec résolution des conflits.
 * @example cn("px-4 py-2", condition && "bg-brand-500", "hover:bg-brand-600")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * formatXOF — Formate un montant en Franc CFA (XOF) selon les conventions sénégalaises.
 * @example formatXOF(35000) → "35 000 FCFA"
 */
export function formatXOF(amount: number): string {
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency: "XOF",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * formatDate — Formate une date en français (Sénégal).
 * @example formatDate("2024-08-14T21:16:50Z") → "14 août 2024, 21:16"
 */
export function formatDate(dateString: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("fr-SN", {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  }).format(new Date(dateString));
}

/**
 * formatRelativeDate — Formate une date relative (ex: "il y a 5 min").
 */
export function formatRelativeDate(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  const diffD = Math.floor(diffH / 24);

  if (diffMin < 1)  return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} min`;
  if (diffH < 24)   return `il y a ${diffH}h`;
  if (diffD < 7)    return `il y a ${diffD}j`;
  return formatDate(dateString, { dateStyle: "short" });
}

/**
 * slugify — Convertit un texte en slug URL-safe.
 * @example slugify("Ma Boutique Dakar !") → "ma-boutique-dakar"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")   // Supprime les accents
    .replace(/[^a-z0-9\s-]/g, "")      // Garde lettres, chiffres, espaces, tirets
    .trim()
    .replace(/\s+/g, "-")              // Espaces → tirets
    .replace(/-+/g, "-")               // Tirets multiples → 1 tiret
    .slice(0, 60);                     // Max 60 chars
}

/**
 * normalizePhone — Normalise un numéro de téléphone sénégalais au format international.
 * Retourne "+221XXXXXXXXX" pour les numéros valides, ou une chaîne vide si invalide.
 * @example normalizePhone("771234567") → "+221771234567"
 * @example normalizePhone("00221771234567") → "+221771234567"
 */
export function normalizePhone(phone: string): string {
  if (!phone) return "";
  let digits = phone.replace(/\D/g, "");
  // Retirer le préfixe 00221 → 221
  if (digits.startsWith("00221")) {
    digits = digits.slice(2); // "00221XXXXXXXXX" → "221XXXXXXXXX" (12 chiffres)
  }
  // Format +221XXXXXXXXX ou 221XXXXXXXXX
  if (digits.startsWith("221") && digits.length === 12) {
    return `+${digits}`;
  }
  // Format XXXXXXXXX (9 chiffres)
  if (digits.length === 9) {
    return `+221${digits}`;
  }
  // Numéro non reconnu — ne pas préfixer aveuglément
  return "";
}

/**
 * truncate — Tronque un texte avec ellipse.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * getInitials — Retourne les initiales d'un nom complet.
 * @example getInitials("Fatou Diallo") → "FD"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

/**
 * getImageUrl — Retourne l'URL de l'image (gère les URLs complètes et relatives).
 */
export function getImageUrl(
  pathOrUrl?: string | null,
  size: "thumb" | "medium" | "large" = "medium"
): string {
  if (!pathOrUrl) return "";
  // Si c'est déjà une URL complète (ex: https://...supabase.co/storage/v1/object/public/...)
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("data:") ||
    pathOrUrl.startsWith("/")
  ) {
    return pathOrUrl;
  }
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[getImageUrl] NEXT_PUBLIC_SUPABASE_URL is not defined. Image will not load.");
    }
    return "";
  }
  const cleanPath = pathOrUrl.startsWith("product-images/")
    ? pathOrUrl
    : `product-images/${pathOrUrl}`;
  return `${supabaseUrl}/storage/v1/object/public/${cleanPath}`;
}


/**
 * isValidSenegalPhone — Valide un numéro de téléphone sénégalais.
 * Accepte uniquement les formats stricts : 9 chiffres ou +221/00221 + 9 chiffres.
 */
export function isValidSenegalPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, "");
  // 9 chiffres commençant par un opérateur sénégalais valide
  if (digits.length === 9 && /^(70|75|76|77|78|33)[0-9]{7}$/.test(digits)) return true;
  // Avec préfixe 221 (12 chiffres)
  if (digits.length === 12 && /^221(70|75|76|77|78|33)[0-9]{7}$/.test(digits)) return true;
  return false;
}

/**
 * DELIVERY_DISTRICTS — Quartiers de Dakar pour l'autocomplete.
 */
export const DAKAR_DISTRICTS = [
  "Plateau", "Médina", "Fann", "Point E", "Mermoz", "Sacré-Cœur",
  "Almadies", "Ngor", "Ouakam", "Yoff", "Parcelles Assainies",
  "Guédiawaye", "Pikine", "Thiaroye", "Mbao", "Rufisque",
  "Grand-Yoff", "HLM", "Colobane", "Liberté", "Khar Yalla",
  "Dieuppeul", "Cité Keur Gorgui", "Sicap Amitié", "VDN",
  "Dakar-Plateau", "Bel-Air", "Port", "Rebeuss", "Sandaga",
] as const;
