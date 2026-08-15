import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Boutik — Créez votre boutique en ligne en 5 minutes",
    template: "%s | Boutik",
  },
  description:
    "Créez votre catalogue en ligne, recevez des commandes et encaissez par Wave ou Orange Money. La solution e-commerce pensée pour les commerçants du Sénégal.",
  keywords: ["boutique en ligne", "e-commerce", "Sénégal", "Wave", "Orange Money", "vente en ligne"],
  authors: [{ name: "Boutik" }],
  creator: "Boutik",
  openGraph: {
    type: "website",
    locale: "fr_SN",
    siteName: "Boutik",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="min-h-screen bg-surface antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
