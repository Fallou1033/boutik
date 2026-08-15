import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateCinetPayPayment } from "@/lib/cinetpay";

/**
 * POST /api/payment/initiate
 * Initie un paiement (CinetPay ou Simulateur Sandbox si pas de clé configurée)
 */
export async function POST(request: NextRequest) {
  try {
    const { order_reference } = await request.json();
    if (!order_reference) {
      return NextResponse.json({ error: "Référence commande requise" }, { status: 400 });
    }

    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    // 1. Récupérer la commande + client
    const { data: orderRaw, error: orderError } = await supabase
      .from("orders")
      .select(`
        id, reference, total, order_status, payment_status, store_id,
        customers(full_name, phone)
      `)
      .eq("reference", order_reference)
      .single();

    if (orderError || !orderRaw) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const order = orderRaw as {
      id: string; reference: string; total: number;
      order_status: string; payment_status: string; store_id: string;
      customers: { full_name: string; phone: string } | null;
    };

    if (order.payment_status === "paid") {
      return NextResponse.json({ error: "Commande déjà payée" }, { status: 400 });
    }

    // Passer la commande en awaiting_payment
    await supabase
      .from("orders")
      .update({ order_status: "awaiting_payment" } as never)
      .eq("id", order.id);

    const apiKey = process.env.CINETPAY_API_KEY;
    const siteId = process.env.CINETPAY_SITE_ID;
    const isMock = !apiKey || apiKey.includes("VOTRE_") || !siteId || siteId.includes("VOTRE_");

    // ── MODE SIMULATION LOCAL (Si pas de clé CinetPay active) ──────────────────
    if (isMock) {
      return NextResponse.json({
        payment_url: `${appUrl}/pay/simulate?ref=${encodeURIComponent(order.reference)}`,
        mode: "simulation",
      });
    }

    // ── MODE CINETPAY RÉEL ──────────────────────────────────────────────────
    const customerName = order.customers?.full_name ?? "Client";
    const nameParts = customerName.split(" ");
    const firstName = nameParts[0] ?? "Client";
    const lastName = nameParts.slice(1).join(" ") || firstName;
    const phone = (order.customers?.phone ?? "").replace(/\D/g, "");

    const cinetpayResponse = await initiateCinetPayPayment({
      transaction_id:        order.reference,
      amount:                Math.round(order.total),
      currency:              "XOF",
      description:           `Commande ${order.reference} — Boutik`,
      notify_url:            `${appUrl}/api/payment/webhook`,
      return_url:            `${appUrl}/pay/result?ref=${order.reference}`,
      customer_name:         lastName,
      customer_surname:      firstName,
      customer_phone_number: phone.startsWith("221") ? `+${phone}` : `+221${phone}`,
      channels:              "MOBILE_MONEY",
    });

    if (cinetpayResponse.code !== "201" || !cinetpayResponse.data?.payment_url) {
      return NextResponse.json(
        { error: cinetpayResponse.message ?? "Erreur passerelle de paiement" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      payment_url:   cinetpayResponse.data.payment_url,
      payment_token: cinetpayResponse.data.payment_token,
    });

  } catch (error) {
    console.error("Payment initiate error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
