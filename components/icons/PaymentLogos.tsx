import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo officiel Wave Sénégal (Manchot officiel Wave + Fond Bleu Ciel)
 */
export function WaveLogo({ className = "w-8 h-8", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Fond bleu officiel Wave */}
      <rect width="100" height="100" rx="22" fill="#1DA1F2" />
      
      {/* Corps du manchot Wave (bleu foncé/noir) */}
      <path
        d="M50 16C38 16 30 24 30 36C30 42 32 46 34 50L31 68C30.5 71 33 74 36 74H64C67 74 69.5 71 69 68L66 50C68 46 70 42 70 36C70 24 62 16 50 16Z"
        fill="#0D2040"
      />
      
      {/* Ventre blanc du manchot */}
      <ellipse cx="50" cy="50" rx="14" ry="19" fill="#FFFFFF" />
      
      {/* Yeux */}
      <circle cx="43" cy="32" r="3" fill="#FFFFFF" />
      <circle cx="57" cy="32" r="3" fill="#FFFFFF" />
      <circle cx="43" cy="32" r="1.5" fill="#0D2040" />
      <circle cx="57" cy="32" r="1.5" fill="#0D2040" />
      
      {/* Bec orange */}
      <path d="M47 36L53 36L50 42L47 36Z" fill="#FF9E00" />
      
      {/* Pattes orange */}
      <path d="M37 74L35 80L43 78L39 74H37Z" fill="#FF9E00" />
      <path d="M63 74L65 80L57 78L61 74H63Z" fill="#FF9E00" />
      
      {/* Vague blanche stylisée en bas */}
      <path
        d="M18 88C28 83 38 93 50 88C62 83 72 93 82 88"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Logo officiel Orange Money (Fond noir + Carré orange officiel OM)
 */
export function OrangeMoneyLogo({ className = "w-8 h-8", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Fond noir */}
      <rect width="100" height="100" rx="22" fill="#000000" />
      
      {/* Carré Orange vibrant officiel */}
      <rect x="14" y="14" width="72" height="72" rx="14" fill="#FF7900" />
      
      {/* Logo officiel OM (Cercle blanc + Doubles chevrons) */}
      <circle cx="39" cy="50" r="14" stroke="#FFFFFF" strokeWidth="6" fill="none" />
      
      {/* Flèches / chevrons dynamiques Orange Money */}
      <path
        d="M54 36L64 50L54 64"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M65 36L75 50L65 64"
        stroke="#FFFFFF"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Logo officiel Free Money Sénégal (Vert officiel #00A859 + Rouge Free)
 */
export function FreeMoneyLogo({ className = "w-8 h-8", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Fond vert Free Money officiel */}
      <rect width="100" height="100" rx="22" fill="#00A859" />
      
      {/* Cercle central blanc */}
      <circle cx="50" cy="50" r="36" fill="#FFFFFF" />
      
      {/* Wordmark officiel 'free' en rouge italic signature */}
      <text
        x="50"
        y="46"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="'Arial Black', 'Trebuchet MS', sans-serif"
        fontWeight="900"
        fontSize="30"
        fontStyle="italic"
        letterSpacing="-1"
        fill="#E60000"
      >
        free
      </text>
      
      {/* Bandeau MONEY en vert Free */}
      <rect x="22" y="58" width="56" height="15" rx="7" fill="#00A859" />
      <text
        x="50"
        y="66.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="10"
        letterSpacing="2"
        fill="#FFFFFF"
      >
        MONEY
      </text>
    </svg>
  );
}

/**
 * Logo Paiement Cash à la livraison (Billet de banque stylisé)
 */
export function CashDeliveryLogo({ className = "w-8 h-8", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Fond émeraude */}
      <rect width="100" height="100" rx="22" fill="#059669" />
      
      {/* Billet de banque */}
      <rect x="18" y="30" width="64" height="40" rx="8" fill="#FFFFFF" />
      <rect x="24" y="36" width="52" height="28" rx="4" stroke="#059669" strokeWidth="3" fill="none" />
      <circle cx="50" cy="50" r="8" fill="#059669" />
      <circle cx="31" cy="50" r="3" fill="#059669" />
      <circle cx="69" cy="50" r="3" fill="#059669" />
    </svg>
  );
}

/**
 * Composant générique PaymentLogo
 */
export function PaymentLogo({ method, className = "w-8 h-8" }: { method: string; className?: string }) {
  switch (method?.toLowerCase()) {
    case "wave":
      return <WaveLogo className={className} />;
    case "orange_money":
    case "orange":
      return <OrangeMoneyLogo className={className} />;
    case "free_money":
    case "free":
      return <FreeMoneyLogo className={className} />;
    case "cash_on_delivery":
    case "cash":
    default:
      return <CashDeliveryLogo className={className} />;
  }
}
