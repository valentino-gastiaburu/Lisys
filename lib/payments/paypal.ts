import "server-only";
import type { CartItem } from "@/lib/types";

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
  cartId: string;
  items: (CartItem & { usdCents: number })[];
  buyerEmail?: string;
}): Promise<{ orderId: string; approveUrl: string }> {
  const { cartId, items, buyerEmail } = params;
  const accessToken = await getAccessToken();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  const totalUsdCents = items.reduce((sum, item) => sum + item.usdCents, 0);
  const description =
    items.length === 1 ? items[0].title.slice(0, 127) : `Compra en Lisys (${items.length} ítems)`;

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
          // A PayPal order only has one custom_id per purchase_unit no
          // matter how many items it bundles — this ties the order back to
          // our own `carts` row (snapshotting exactly which products were
          // bought) for the webhook and the success page, same as
          // Mercado Pago's external_reference.
          custom_id: cartId,
          description,
          amount: {
            currency_code: "USD",
            value: (totalUsdCents / 100).toFixed(2),
            breakdown: {
              item_total: { currency_code: "USD", value: (totalUsdCents / 100).toFixed(2) },
            },
          },
          items: items.map((item) => ({
            name: item.title.slice(0, 127),
            quantity: "1",
            unit_amount: { currency_code: "USD", value: (item.usdCents / 100).toFixed(2) },
          })),
        },
      ],
      payer: buyerEmail ? { email_address: buyerEmail } : undefined,
      payment_source: {
        paypal: {
          experience_context: {
            return_url: `${siteUrl}/orden/exito?provider=paypal`,
            cancel_url: `${siteUrl}/carrito`,
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
  // When the order is created with an explicit `payment_source` (as above),
  // PayPal's Orders v2 API names the redirect link "payer-action" instead of
  // the "approve" rel used in the older, payment_source-less flow.
  const approveUrl = json.links.find(
    (l: { rel: string }) => l.rel === "approve" || l.rel === "payer-action"
  )?.href;
  if (!approveUrl) throw new Error("PayPal no devolvió un link de aprobación");

  return { orderId: json.id, approveUrl };
}

export interface PayPalCapture {
  status: string;
  captureId: string | null;
  amountCents: number | null;
  currency: string | null;
  payerEmail: string;
  cartId: string | null;
  /** Funding source used ("paypal", "card", "venmo", ...), from `payment_source`. */
  paymentMethod: string | null;
  /** PayPal's issue code (e.g. "INSTRUMENT_DECLINED") when the capture didn't complete. */
  declineReason: string | null;
}

/**
 * Captures an approved order. Safe to call more than once for the same
 * order — if it was already captured (e.g. a redelivered webhook), fetches
 * the existing capture instead of erroring. On a genuine decline (e.g. the
 * card was rejected at capture time), returns a non-"COMPLETED" result with
 * `declineReason` instead of throwing, so the caller can record the failed
 * attempt.
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
      // Genuine decline — look up the order for buyer/product/method context
      // (best-effort; the capture itself failed, so these may be missing).
      const declineReason = json?.details?.[0]?.issue ?? json?.name ?? `HTTP_${response.status}`;
      let payerEmail = "";
      let cartId: string | null = null;
      let paymentMethod: string | null = null;
      const getResponse = await fetch(`${API_BASE}/v2/checkout/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (getResponse.ok) {
        const orderJson = await getResponse.json();
        payerEmail = orderJson.payer?.email_address ?? "";
        cartId = orderJson.purchase_units?.[0]?.custom_id ?? null;
        paymentMethod = Object.keys(orderJson.payment_source ?? {})[0] ?? null;
      }
      return {
        status: "DECLINED",
        captureId: null,
        amountCents: null,
        currency: null,
        payerEmail,
        cartId,
        paymentMethod,
        declineReason,
      };
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
    cartId: purchaseUnit.custom_id ?? null,
    paymentMethod: Object.keys(json.payment_source ?? {})[0] ?? null,
    declineReason: capture.status !== "COMPLETED" ? capture.status : null,
  };
}

/** Human-readable labels for PayPal's funding-source keys. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  paypal: "Saldo/cuenta PayPal",
  card: "Tarjeta (vía PayPal)",
  venmo: "Venmo",
};

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
