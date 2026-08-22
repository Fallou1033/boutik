import React from "react";
import Image from "next/image";

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Logo officiel Wave Sénégal (Image PNG officielle avec manchot et typographie Wave)
 */
export function WaveLogo({ className = "w-10 h-10", size }: LogoProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-[#00A3FF] flex items-center justify-center shadow-sm flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <Image
        src="/images/payments/wave.png"
        alt="Wave"
        width={64}
        height={64}
        className="object-cover w-full h-full"
      />
    </div>
  );
}

/**
 * Logo officiel Orange Money (Image PNG officielle avec double flèche et texte)
 */
export function OrangeMoneyLogo({ className = "w-10 h-10", size }: LogoProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-white border border-surface-border flex items-center justify-center shadow-sm p-1 flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <Image
        src="/images/payments/orange_money.png"
        alt="Orange Money"
        width={64}
        height={64}
        className="object-contain w-full h-full"
      />
    </div>
  );
}

/**
 * Logo officiel Free Money Sénégal (Image PNG officielle avec typo free rouge et bandeau MONEY)
 */
export function FreeMoneyLogo({ className = "w-10 h-10", size }: LogoProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-white border border-surface-border flex items-center justify-center shadow-sm p-1 flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <Image
        src="/images/payments/free_money.png"
        alt="Free Money"
        width={64}
        height={64}
        className="object-contain w-full h-full"
      />
    </div>
  );
}

/**
 * Logo Paiement Cash à la livraison
 */
export function CashDeliveryLogo({ className = "w-10 h-10", size }: LogoProps) {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-emerald-500 flex items-center justify-center shadow-sm p-1.5 flex-shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <rect x="6" y="12" width="36" height="24" rx="4" fill="white" />
        <rect x="9" y="15" width="30" height="18" rx="2" stroke="#059669" strokeWidth="2" fill="none" />
        <circle cx="24" cy="24" r="4.5" fill="#059669" />
        <circle cx="13" cy="24" r="2" fill="#059669" />
        <circle cx="35" cy="24" r="2" fill="#059669" />
      </svg>
    </div>
  );
}

/**
 * Composant générique PaymentLogo
 */
export function PaymentLogo({ method, className = "w-10 h-10" }: { method: string; className?: string }) {
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
