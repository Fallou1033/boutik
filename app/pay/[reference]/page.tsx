import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import PaymentPage from "@/components/payment/PaymentPage";

interface Props {
  params: { reference: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `Paiement — ${params.reference}`,
    description: "Finalisez votre paiement sécurisé",
    robots: "noindex",
  };
}

export default async function PayPage({ params }: Props) {
  const supabase = await createClient();

  const { data: orderRaw } = await supabase
    .from("orders")
    .select(`
      id, reference, order_status, payment_status, total, subtotal, delivery_fee,
      payment_method, created_at,
      stores(name, slug, whatsapp_number),
      customers(full_name, phone),
      order_items(product_name, unit_price, quantity, line_total, product_image)
    `)
    .eq("reference", params.reference)
    .single();

  if (!orderRaw) notFound();

  const order = orderRaw as {
    id: string; reference: string; order_status: string;
    payment_status: string; total: number; subtotal: number;
    delivery_fee: number; payment_method: string | null; created_at: string;
    stores: { name: string; slug: string; whatsapp_number: string } | null;
    customers: { full_name: string; phone: string } | null;
    order_items: Array<{
      product_name: string; unit_price: number; quantity: number;
      line_total: number; product_image: string | null;
    }>;
  };

  // Si déjà payée, rediriger vers la page de succès
  if (order.payment_status === "paid") {
    const { redirect } = await import("next/navigation");
    redirect(`/pay/result?ref=${order.reference}&status=success`);
  }

  return <PaymentPage order={order} />;
}
