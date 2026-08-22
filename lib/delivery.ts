import { formatXOF } from "./utils";

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  description: string;
  districts: string[];
}

export const SENEGAL_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "zone-1",
    name: "Dakar Centre & Plateau",
    fee: 2000,
    description: "Plateau, Médina, Fann, Point E, Mermoz, Sacré-Cœur, Amitié, Fass...",
    districts: [
      "Plateau", "Dakar-Plateau", "Médina", "Fann", "Point E", "Mermoz",
      "Sacré-Cœur", "Amitié", "Sicap Amitié", "Fass", "Colobane",
      "Gueule Tapée", "Bel-Air", "Port", "Rebeuss", "Sandaga", "Centenaire"
    ],
  },
  {
    id: "zone-2",
    name: "Grand Dakar, VDN & Maristes",
    fee: 2000,
    description: "Grand-Yoff, HLM, Liberté (1 à 6), Khar Yalla, Dieuppeul, Maristes...",
    districts: [
      "Grand-Yoff", "HLM", "Liberté", "Khar Yalla", "Dieuppeul",
      "Derklé", "Castors", "Cité Keur Gorgui", "Sicap", "VDN",
      "Hann Maristes", "Maristes", "Patte d'Oie", "Zone de Captage", "Scat Urbam"
    ],
  },
  {
    id: "zone-3",
    name: "Almadies, Ouakam & Yoff",
    fee: 2500,
    description: "Almadies, Ngor, Ouakam, Yoff, Mamelles, Virage, Foires...",
    districts: [
      "Almadies", "Ngor", "Ouakam", "Yoff", "Mamelles", "Virage",
      "Nord Foire", "Ouest Foire", "Sud Foire", "Cité Mixta", "Cité Keur Damel"
    ],
  },
  {
    id: "zone-4",
    name: "Parcelles Assainies & Banlieue Proche",
    fee: 2500,
    description: "Parcelles Assainies (Unité 1 à 26), Cambérène, Golf Sud, Guédiawaye, Pikine...",
    districts: [
      "Parcelles Assainies", "Cambérène", "Golf Sud", "Guédiawaye", "Pikine", "Sam Notaire",
      "Cité Fadia", "Cité Aliou Sow", "Hamo", "Golf"
    ],
  },
  {
    id: "zone-5",
    name: "Banlieue Élargie & Keur Massar",
    fee: 4000,
    description: "Keur Massar, Mbao, Zac Mbao, Thiaroye, Yeumbeul, Malika, Diamaguène...",
    districts: [
      "Keur Massar", "Zac Mbao", "ZAC Mbao", "Mbao", "Thiaroye", "Yeumbeul", "Malika",
      "Diamaguène", "Tivaouane Peulh", "Jaxaay", "Kounoune"
    ],
  },
  {
    id: "zone-6",
    name: "Rufisque, Diamniadio & Périphérie",
    fee: 4500,
    description: "Rufisque, Bargny, Diamniadio, Sébikotane, Sangalkam, Lac Rose...",
    districts: [
      "Rufisque", "Bargny", "Diamniadio", "Sébikotane", "Sangalkam", "Lac Rose", "Niaga", "Sendou"
    ],
  },
  {
    id: "zone-regions",
    name: "Régions du Sénégal (Transporteur / GP)",
    fee: 5000,
    description: "Thiès, Mbour, Saly, Saint-Louis, Touba, Kaolack, Ziguinchor...",
    districts: [
      "Thiès", "Mbour", "Saly", "Saint-Louis", "Touba", "Kaolack",
      "Ziguinchor", "Fatick", "Louga", "Diourbel", "Kolda", "Tambacounda", "Matam", "Kédougou"
    ],
  },
];

/**
 * Liste aplatie de tous les quartiers pour l'autocomplete
 */
export const ALL_DISTRICTS_WITH_FEE = SENEGAL_DELIVERY_ZONES.flatMap((zone) =>
  zone.districts.map((d) => ({
    name: d,
    fee: zone.fee,
    zoneName: zone.name,
  }))
).sort((a, b) => a.name.localeCompare(b.name));

/**
 * Calcule les frais de livraison dynamiques en fonction du quartier et de la ville
 */
export function calculateDeliveryFee(
  district?: string | null,
  city?: string | null
): { fee: number; zoneName: string } {
  if (!district && !city) {
    return { fee: 2000, zoneName: "Dakar standard" };
  }

  const cleanDistrict = (district || "").trim().toLowerCase();
  const cleanCity = (city || "").trim().toLowerCase();

  // Si la ville n'est pas Dakar
  if (cleanCity && cleanCity !== "dakar") {
    const regionZone = SENEGAL_DELIVERY_ZONES.find((z) => z.id === "zone-regions");
    return { fee: regionZone?.fee ?? 5000, zoneName: regionZone?.name ?? "Régions" };
  }

  // Chercher par correspondance dans les quartiers
  // M-6: Correspondance partielle limitée à un minimum de 3 caractères pour éviter
  // les faux positifs (ex: "a" qui matche "Almadies")
  for (const zone of SENEGAL_DELIVERY_ZONES) {
    const matched = zone.districts.some((d) => {
      const dl = d.toLowerCase();
      // Correspondance exacte en priorité
      if (cleanDistrict === dl) return true;
      // Correspondance partielle : le quartier doit contenir ce qu'a tapé l'utilisateur
      // (et non l'inverse) avec un minimum de 3 caractères pour éviter les faux positifs
      if (cleanDistrict.length >= 3 && dl.includes(cleanDistrict)) return true;
      return false;
    });
    if (matched) {
      return { fee: zone.fee, zoneName: zone.name };
    }
  }

  // Tarif par défaut pour Dakar
  return { fee: 2000, zoneName: "Dakar standard" };
}

