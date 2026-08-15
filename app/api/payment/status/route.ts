import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkCinetPayTransaction } from "@/lib/cinetpay";

/**
 * GET /api/payment/status?ref=CMD-XXXX
 * Vérifie le statut d'une commande côté DB (polling depuis la page de résultat)
 */
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref) {
    return NextResponse.json({ error: "Référence requise" }, { status: 400 });
  }

  const supabase = await createClient();

  const { data: orderRaw } = await supabase
    .from("orders")
    .select("id, reference, order_status, payment_status, total")
    .eq("reference", ref)
    .single();

  if (!orderRaw) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const order = orderRaw as {
    id: string; reference: string;
    order_status: string; payment_status: string; total: number;
  };

  return NextResponse.json({
    reference:      order.reference,
    order_status:   order.order_status,
    payment_status: order.payment_status,
    total:          order.total,
    is_paid:        order.payment_status === "paid",
  });
}
