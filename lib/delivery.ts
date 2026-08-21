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
    fee: 1500,
    description: "Plateau, Médina, Fann, Point E, Mermoz, Sacré-Cœur, Amitié...",
    districts: [
      "Plateau", "Dakar-Plateau", "Médina", "Fann", "Point E", "Mermoz",
      "Sacré-Cœur", "Amitié", "Sicap Amitié", "Fass", "Colobane",
      "Gueule Tapée", "Bel-Air", "Port", "Rebeuss", "Sandaga", "Centenaire"
    ],
  },
  {
    id: "zone-2",
    name: "Grand Dakar, VDN & Maristes",
    fee: 1500,
    description: "Grand-Yoff, HLM, Liberté (1 à 6), Khar Yalla, Dieuppeul, Maristes...",
    districts: [
      "Grand-Yoff", "HLM", "Liberté", "Khar Yalla", "Dieuppeul",
      "Derklé", "Castors", "Cité Keur Gorgui", "Sicap", "VDN",
      "Hann Maristes", "Maristes", "Patte d'Oie", "Zone de Captage"
    ],
  },
  {
    id: "zone-3",
    name: "Almadies, Ouakam & Yoff",
    fee: 2000,
    description: "Almadies, Ngor, Ouakam, Yoff, Mamelles, Virage, Foires...",
    districts: [
      "Almadies", "Ngor", "Ouakam", "Yoff", "Mamelles", "Virage",
      "Nord Foire", "Ouest Foire", "Sud Foire", "Cité Mixta"
    ],
  },
  {
    id: "zone-4",
    name: "Parcelles Assainies & Banlieue Proche",
    fee: 2000,
    description: "Parcelles Assainies (Unité 1 à 26), Cambérène, Golf Sud, Guédiawaye, Pikine...",
    districts: [
      "Parcelles Assainies", "Cambérène", "Golf Sud", "Guédiawaye", "Pikine", "Sam Notaire"
    ],
  },
  {
    id: "zone-5",
    name: "Banlieue Élargie & Keur Massar",
    fee: 2500,
    description: "Keur Massar, Thiaroye, Yeumbeul, Malika, Mbao, Diamaguène...",
    districts: [
      "Keur Massar", "Thiaroye", "Yeumbeul", "Malika", "Mbao", "Diamaguène", "Tivaouane Peulh"
    ],
  },
  {
    id: "zone-6",
    name: "Rufisque, Diamniadio & Périphérie",
    fee: 3000,
    description: "Rufisque, Bargny, Diamniadio, Sébikotane, Sangalkam, Lac Rose...",
    districts: [
      "Rufisque", "Bargny", "Diamniadio", "Sébikotane", "Sangalkam", "Lac Rose", "Niaga"
    ],
  },
  {
    id: "zone-regions",
    name: "Régions du Sénégal (Transporteur / GP)",
    fee: 3500,
    description: "Thiès, Mbour, Saint-Louis, Touba, Kaolack, Ziguinchor...",
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
    return { fee: 1500, zoneName: "Dakar standard" };
  }

  const cleanDistrict = (district || "").trim().toLowerCase();
  const cleanCity = (city || "").trim().toLowerCase();

  // Si la ville n'est pas Dakar
  if (cleanCity && cleanCity !== "dakar") {
    const regionZone = SENEGAL_DELIVERY_ZONES.find((z) => z.id === "zone-regions");
    return { fee: regionZone?.fee ?? 3500, zoneName: regionZone?.name ?? "Régions" };
  }

  // Chercher par correspondance exacte ou partielle dans les quartiers
  for (const zone of SENEGAL_DELIVERY_ZONES) {
    const matched = zone.districts.some(
      (d) =>
        cleanDistrict === d.toLowerCase() ||
        cleanDistrict.includes(d.toLowerCase()) ||
        d.toLowerCase().includes(cleanDistrict)
    );
    if (matched) {
      return { fee: zone.fee, zoneName: zone.name };
    }
  }

  // Tarif par défaut pour Dakar
  return { fee: 1500, zoneName: "Dakar standard" };
}
