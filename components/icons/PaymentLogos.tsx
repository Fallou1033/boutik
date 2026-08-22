import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo officiel Wave Sénégal (Bleu ciel #1CA9F2 + Manchot blanc + Vague)
 */
export function WaveLogo({ className = "w-7 h-7", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect width="48" height="48" rx="12" fill="#1CA9F2" />
      {/* Silhouette Manchot Wave */}
      <path
        d="M24 9C19.5 9 16 12.5 16 17C16 19.2 16.9 21.2 18.3 22.6L17 30C16.8 31.1 17.6 32 18.7 32H29.3C30.4 32 31.2 31.1 31 30L29.7 22.6C31.1 21.2 32 19.2 32 17C32 12.5 28.5 9 24 9Z"
        fill="white"
      />
      {/* Détails intérieur */}
      <ellipse cx="24" cy="21" rx="4.5" ry="6" fill="#1CA9F2" />
      <circle cx="21.5" cy="15" r="1.2" fill="#1CA9F2" />
      <circle cx="26.5" cy="15" r="1.2" fill="#1CA9F2" />
      {/* Bec orange */}
      <path d="M23 16.5L25 16.5L24 18.5L23 16.5Z" fill="#FFA500" />
      {/* Pattes */}
      <path d="M19 32L18 35L21 34L19 32Z" fill="#FFA500" />
      <path d="M29 32L30 35L27 34L29 32Z" fill="#FFA500" />
      {/* Vague blanche */}
      <path
        d="M11 39C15 37 19 41 24 39C29 37 33 41 37 39"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Logo officiel Orange Money (Fond noir + Carré orange OM)
 */
export function OrangeMoneyLogo({ className = "w-7 h-7", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect width="48" height="48" rx="12" fill="#000000" />
      {/* Carré Orange signature */}
      <rect x="7" y="7" width="34" height="34" rx="8" fill="#FF7900" />
      {/* Symboles stylisés Orange Money */}
      <circle cx="19" cy="24" r="6.5" stroke="white" strokeWidth="3" fill="none" />
      <path
        d="M26 17.5L31 24L26 30.5M30.5 17.5L35.5 24L30.5 30.5"
        stroke="white"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Logo officiel Free Money Sénégal (Vert #00A859 + Rouge Free)
 */
export function FreeMoneyLogo({ className = "w-7 h-7", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect width="48" height="48" rx="12" fill="#00A859" />
      {/* Badge central blanc */}
      <circle cx="24" cy="24" r="16" fill="white" />
      {/* Typographie Free stylisée */}
      <text
        x="24"
        y="22.5"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="sans-serif"
        fontWeight="900"
        fontSize="13"
        fontStyle="italic"
        fill="#E60000"
      >
        free
      </text>
      {/* Badge MONEY */}
      <rect x="13" y="27" width="22" height="6.5" rx="3" fill="#00A859" />
      <text
        x="24"
        y="31.2"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="sans-serif"
        fontWeight="800"
        fontSize="4.8"
        letterSpacing="0.8"
        fill="white"
      >
        MONEY
      </text>
    </svg>
  );
}

/**
 * Logo Paiement Cash à la livraison
 */
export function CashDeliveryLogo({ className = "w-7 h-7", size }: LogoProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <rect width="48" height="48" rx="12" fill="#059669" />
      {/* Billet de banque stylisé */}
      <rect x="8" y="14" width="32" height="20" rx="4" fill="white" />
      <rect x="11" y="17" width="26" height="14" rx="2" stroke="#059669" strokeWidth="1.6" fill="none" />
      <circle cx="24" cy="24" r="4" fill="#059669" />
      <circle cx="14.5" cy="24" r="1.5" fill="#059669" />
      <circle cx="33.5" cy="24" r="1.5" fill="#059669" />
    </svg>
  );
}

/**
 * Composant générique PaymentLogo
 */
export function PaymentLogo({ method, className = "w-7 h-7" }: { method: string; className?: string }) {
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
