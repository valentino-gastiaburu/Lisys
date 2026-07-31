import "server-only";
import type { Product } from "@/lib/types";

const API_BASE = process.env.PAYPAL_ENV === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${API_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal auth failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return json.access_token as string;
}

export async function createOrder(params: {
  product: Product;
  usdCents: number;
  buyerEmail?: string;
}): Promise<{ orderId: string; approveUrl: string }> {
  const { product, usdCents, buyerEmail } = params;
  const accessToken = await getAccessToken();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const response = await fetch(`${API_BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: product.id,
          description: product.title.slice(0, 127),
          amount: {
            currency_code: "USD",
            value: (usdCents / 100).toFixed(2),
          },
        },
      ],
      payer: buyerEmail ? { email_address: buyerEmail } : undefined,
      payment_source: {
        paypal: {
          experience_context: {
            return_url: `${siteUrl}/orden/exito?provider=paypal`,
            cancel_url: `${siteUrl}/producto/${product.slug}`,
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal order creation failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  const approveUrl = json.links.find((l: { rel: string }) => l.rel === "approve")?.href;
  if (!approveUrl) throw new Error("PayPal no devolvió un link de aprobación");

  return { orderId: json.id, approveUrl };
}

export interface PayPalCapture {
  status: string;
  captureId: string;
  amountCents: number;
  currency: string;
  payerEmail: string;
  productId: string | null;
}

/**
 * Captures an approved order. Safe to call more than once for the same
 * order — if it was already captured (e.g. a redelivered webhook), fetches
 * the existing capture instead of erroring.
 */
export async function captureOrder(orderId: string): Promise<PayPalCapture> {
  const accessToken = await getAccessToken();

  const response = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  let json = await response.json();

  if (!response.ok) {
    const alreadyCaptured = json?.details?.some(
      (d: { issue: string }) => d.issue === "ORDER_ALREADY_CAPTURED"
    );
    if (!alreadyCaptured) {
      throw new Error(`PayPal capture failed: ${response.status} ${JSON.stringify(json)}`);
    }
    const getResponse = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!getResponse.ok) {
      throw new Error(`PayPal get order failed: ${getResponse.status}`);
    }
    json = await getResponse.json();
  }

  const purchaseUnit = json.purchase_units[0];
  const capture = purchaseUnit.payments.captures[0];

  return {
    status: capture.status,
    captureId: capture.id,
    amountCents: Math.round(parseFloat(capture.amount.value) * 100),
    currency: capture.amount.currency_code,
    payerEmail: json.payer?.email_address ?? "",
    productId: purchaseUnit.custom_id ?? null,
  };
}

/** Delegates signature verification to PayPal's own endpoint instead of
 * re-implementing certificate-based signature checking ourselves. */
export async function verifyWebhookSignature(params: {
  transmissionId: string | null;
  transmissionTime: string | null;
  certUrl: string | null;
  authAlgo: string | null;
  transmissionSig: string | null;
  webhookEvent: unknown;
}): Promise<boolean> {
  const { transmissionId, transmissionTime, certUrl, authAlgo, transmissionSig, webhookEvent } =
    params;
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return false;
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${API_BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      transmission_id: transmissionId,
      transmission_time: transmissionTime,
      cert_url: certUrl,
      auth_algo: authAlgo,
      transmission_sig: transmissionSig,
      webhook_id: process.env.PAYPAL_WEBHOOK_ID,
      webhook_event: webhookEvent,
    }),
  });

  if (!response.ok) return false;
  const json = await response.json();
  return json.verification_status === "SUCCESS";
}
