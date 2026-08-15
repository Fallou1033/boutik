/**
 * CinetPay API Client
 * Passerelle de paiement pour le Sénégal — Wave, Orange Money, Free Money
 * Documentation: https://docs.cinetpay.com/
 */

const CINETPAY_API_URL = "https://api-checkout.cinetpay.com/v2/payment";
const CINETPAY_CHECK_URL = "https://api-checkout.cinetpay.com/v2/payment/check";

export interface CinetPayInitParams {
  transaction_id: string;     // Référence unique (notre order.reference)
  amount: number;             // Montant en XOF
  currency: "XOF";
  description: string;
  notify_url: string;         // Webhook URL
  return_url: string;         // Redirection après paiement
  customer_name: string;
  customer_surname: string;
  customer_phone_number: string;
  customer_email?: string;
  channels?: "ALL" | "MOBILE_MONEY" | "CREDIT_CARD" | "WALLET";
}

export interface CinetPayInitResponse {
  code: string;
  message: string;
  data?: {
    payment_token: string;
    payment_url: string;
  };
}

export interface CinetPayCheckResponse {
  code: string;
  message: string;
  data?: {
    transaction_id: string;
    amount: string;
    currency_code: string;
    status: "ACCEPTED" | "REFUSED" | "PENDING";
    payment_method: string;
    payment_date: string;
    operator_id?: string;
  };
}

/**
 * Initialise un paiement CinetPay et retourne l'URL de paiement
 */
export async function initiateCinetPayPayment(
  params: CinetPayInitParams
): Promise<CinetPayInitResponse> {
  const apiKey  = process.env.CINETPAY_API_KEY;
  const siteId  = process.env.CINETPAY_SITE_ID;

  if (!apiKey || !siteId) {
    throw new Error("CINETPAY_API_KEY et CINETPAY_SITE_ID sont requis");
  }

  const payload = {
    apikey:               apiKey,
    site_id:              siteId,
    transaction_id:       params.transaction_id,
    amount:               params.amount,
    currency:             params.currency,
    description:          params.description,
    notify_url:           params.notify_url,
    return_url:           params.return_url,
    channels:             params.channels ?? "MOBILE_MONEY",
    customer_name:        params.customer_name,
    customer_surname:     params.customer_surname,
    customer_phone_number: params.customer_phone_number,
    customer_email:       params.customer_email ?? "client@boutik.sn",
    lang:                 "fr",
    metadata:             JSON.stringify({ transaction_id: params.transaction_id }),
  };

  const res = await fetch(CINETPAY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`CinetPay API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

/**
 * Vérifie le statut d'une transaction CinetPay (pour le webhook)
 */
export async function checkCinetPayTransaction(
  transactionId: string,
  siteId: string
): Promise<CinetPayCheckResponse> {
  const apiKey = process.env.CINETPAY_API_KEY;
  if (!apiKey) throw new Error("CINETPAY_API_KEY requis");

  const res = await fetch(CINETPAY_CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apikey: apiKey,
      site_id: siteId,
      transaction_id: transactionId,
    }),
  });

  if (!res.ok) {
    throw new Error(`CinetPay check error: ${res.status}`);
  }

  return res.json();
}

/**
 * Génère un idempotency key pour les webhooks (évite les doubles traitements)
 */
export function generateIdempotencyKey(
  transactionId: string,
  amount: string
): string {
  return `cinetpay_${transactionId}_${amount}`;
}
