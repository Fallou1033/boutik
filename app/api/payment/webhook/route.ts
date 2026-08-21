import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkCinetPayTransaction, generateIdempotencyKey } from "@/lib/cinetpay";

/**
 * POST /api/payment/webhook
 * Reçoit les notifications de paiement CinetPay.
 *
 * CinetPay envoie : cpm_trans_id, cpm_site_id, cpm_amount, cpm_currency,
 *                   cpm_payment_date, cpm_payment_time, cpm_error_message,
 *                   cpm_result (00 = success), cpm_trans_status
 */
export async function POST(request: NextRequest) {
  let body: Record<string, string> = {};

  try {
    // CinetPay envoie parfois en form-data, parfois en JSON
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        body[key] = String(value);
      });
    }
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // ── FIX #3a : Vérification du secret webhook ───────────────────────────
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret) {
    const receivedSecret = request.headers.get("x-cinetpay-secret");
    if (receivedSecret !== webhookSecret) {
      console.warn("Webhook: secret invalide reçu");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const {
    cpm_trans_id,
    cpm_site_id,
    cpm_amount,
    cpm_result,
    cpm_trans_status,
  } = body;

  if (!cpm_trans_id || !cpm_site_id) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // ── FIX #3b : Vérifier que le site_id correspond au nôtre ─────────────
  const expectedSiteId = process.env.CINETPAY_SITE_ID;
  if (expectedSiteId && cpm_site_id !== expectedSiteId) {
    console.warn("Webhook: cpm_site_id invalide:", cpm_site_id);
    return NextResponse.json({ error: "Invalid site_id" }, { status: 403 });
  }

  const supabase = createAdminClient();

  // 1. Récupérer la commande par sa référence (= transaction_id)
  const { data: orderRaw } = await supabase
    .from("orders")
    .select("id, reference, total, store_id, order_status, webhook_idempotency_key")
    .eq("reference", cpm_trans_id)
    .single();

  if (!orderRaw) {
    console.error("Webhook: order not found for", cpm_trans_id);
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const order = orderRaw as {
    id: string; reference: string; total: number; store_id: string;
    order_status: string; webhook_idempotency_key: string | null;
  };

  // 2. Idempotency check — évite le double traitement
  const idempotencyKey = generateIdempotencyKey(cpm_trans_id, cpm_amount ?? "0");
  if (order.webhook_idempotency_key === idempotencyKey) {
    console.log("Webhook duplicate, skipping:", idempotencyKey);
    // Journaliser le doublon
    await supabase.from("payment_logs").insert({
      order_id:   order.id,
      store_id:   order.store_id,
      event_type: "webhook_duplicate",
      provider:   "cinetpay",
      raw_payload: body,
      success:    false,
    } as never);
    return NextResponse.json({ status: "already_processed" });
  }

  // 3. Vérification du paiement auprès de CinetPay (double-check sécurité)
  let verifiedStatus: "ACCEPTED" | "REFUSED" | "PENDING" = "PENDING";
  try {
    const check = await checkCinetPayTransaction(cpm_trans_id, expectedSiteId || cpm_site_id);
    if (check.code === "00" && check.data) {
      verifiedStatus = check.data.status;
    } else {
      console.warn("CinetPay check returned non-00 code:", check.code, check.message);
      verifiedStatus = cpm_result === "00" && webhookSecret ? "ACCEPTED" : "REFUSED";
    }
  } catch (err) {
    console.error("CinetPay verification check error:", err);
    // Si la vérification échoue, on accepte uniquement si le webhookSecret était présent et vérifié
    verifiedStatus = cpm_result === "00" && webhookSecret ? "ACCEPTED" : "PENDING";
  }

  // 4. Journaliser la réception du webhook
  await supabase.from("payment_logs").insert({
    order_id:   order.id,
    store_id:   order.store_id,
    event_type: "webhook_received",
    provider:   "cinetpay",
    amount:     parseFloat(cpm_amount ?? "0"),
    currency:   "XOF",
    raw_payload: body,
    success:    verifiedStatus === "ACCEPTED",
  } as never);

  // 5. Traitement selon le résultat
  if (verifiedStatus === "ACCEPTED") {
    try {
      // Appel de la fonction PostgreSQL atomique (gère le stock + mise à jour commande)
      await supabase.rpc("process_successful_payment" as never, {
        p_order_reference:      order.reference,
        p_payment_provider_ref: cpm_trans_id,
        p_amount:               parseFloat(cpm_amount ?? "0"),
        p_idempotency_key:      idempotencyKey,
        p_raw_payload:          body,
      } as never);

      console.log("Payment confirmed for order:", order.reference);
    } catch (err) {
      console.error("process_successful_payment error:", err);
      // Journaliser l'erreur
      await supabase.from("payment_logs").insert({
        order_id:   order.id,
        store_id:   order.store_id,
        event_type: "webhook_failed_signature",
        provider:   "cinetpay",
        error_message: String(err),
        success:    false,
      } as never);
      return NextResponse.json({ error: "Processing error" }, { status: 500 });
    }
  } else if (verifiedStatus === "REFUSED") {
    // Paiement refusé → repasser en pending
    await supabase
      .from("orders")
      .update({
        payment_status: "failed",
        order_status:   "pending",
      } as never)
      .eq("id", order.id);

    await supabase.from("payment_logs").insert({
      order_id:   order.id,
      store_id:   order.store_id,
      event_type: "payment_failed",
      provider:   "cinetpay",
      raw_payload: body,
      success:    false,
      error_message: `CinetPay status: ${cpm_trans_status ?? "REFUSED"}`,
    } as never);
  }

  // CinetPay requiert une réponse 200 pour arrêter les retentatives
  return NextResponse.json({ status: "ok" });
}

// CinetPay peut aussi envoyer des GET pour les tests
export async function GET() {
  return NextResponse.json({ status: "webhook endpoint active" });
}
