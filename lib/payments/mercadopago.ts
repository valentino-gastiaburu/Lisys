import "server-only";
import crypto from "node:crypto";
import type { CartItem } from "@/lib/types";

const API_BASE = "https://api.mercadopago.com";

export async function createPreference(params: {
  cartId: string;
  items: CartItem[];
  buyerEmail?: string;
  buyerName?: string;
}): Promise<string> {
  const { cartId, items, buyerEmail, buyerName } = params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // Mercado Pago's fraud scoring trusts a preference more when the payer has
  // more than just an email — splitting the full name into name/surname is
  // one of their own documented recommendations to reduce false rejections.
  const [name, ...rest] = (buyerName ?? "").trim().split(/\s+/).filter(Boolean);
  const surname = rest.join(" ") || undefined;

  const response = await fetch(`${API_BASE}/checkout/preferences`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      items: items.map((item) => ({
        title: item.title,
        quantity: 1,
        unit_price: item.price_cents / 100,
        currency_id: item.currency,
      })),
      // Mercado Pago has no way to create a product ahead of time like a
      // Gumroad/Lemon Squeezy catalog, and a preference only carries a
      // single external_reference no matter how many items it has — this
      // ties the preference back to our own `carts` row (snapshotting
      // exactly which products were bought) for the webhook and the
      // success page.
      external_reference: cartId,
      payer: buyerEmail ? { email: buyerEmail, name, surname } : undefined,
      back_urls: {
        success: `${siteUrl}/orden/exito`,
        pending: `${siteUrl}/orden/exito`,
        failure: `${siteUrl}/orden/error?cart_id=${cartId}`,
      },
      auto_return: "approved",
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago preference creation failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return json.init_point as string;
}

/**
 * Verifies the `x-signature` header per Mercado Pago's manifest format:
 * `id:{data.id};request-id:{x-request-id};ts:{ts};` signed with HMAC-SHA256
 * using the webhook secret from the app's Webhooks settings.
 */
export function verifyWebhookSignature(params: {
  dataId: string;
  xSignature: string | null;
  xRequestId: string | null;
}): boolean {
  const { dataId, xSignature, xRequestId } = params;
  if (!xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key.trim(), value?.trim()];
    })
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId.toLowerCase()};request-id:${xRequestId};ts:${ts};`;
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET!;
  const digest = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  const digestBuffer = Buffer.from(digest, "utf8");
  const v1Buffer = Buffer.from(v1, "utf8");
  if (digestBuffer.length !== v1Buffer.length) return false;
  return crypto.timingSafeEqual(digestBuffer, v1Buffer);
}

export interface MercadoPagoPayment {
  id: string;
  status: string;
  statusDetail: string;
  paymentMethodId: string;
  transactionAmountCents: number;
  currency: string;
  payerEmail: string;
  externalReference: string | null;
}

export async function fetchPayment(paymentId: string): Promise<MercadoPagoPayment> {
  const response = await fetch(`${API_BASE}/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mercado Pago fetch payment failed: ${response.status} ${body}`);
  }

  const json = await response.json();
  return {
    id: String(json.id),
    status: json.status,
    statusDetail: json.status_detail ?? "",
    paymentMethodId: json.payment_method_id ?? "",
    transactionAmountCents: Math.round(json.transaction_amount * 100),
    currency: json.currency_id,
    payerEmail: json.payer?.email ?? "",
    externalReference: json.external_reference ?? null,
  };
}

/**
 * Human-readable explanations for Mercado Pago's `status_detail` codes, per
 * https://www.mercadopago.com.mx/developers/es/docs/checkout-api/how-tos/reasons-for-rejection
 */
export const REJECTION_REASONS: Record<string, string> = {
  cc_rejected_bad_filled_card_number: "Revisá el número de la tarjeta.",
  cc_rejected_bad_filled_date: "Revisá la fecha de vencimiento.",
  cc_rejected_bad_filled_other: "Revisá los datos ingresados.",
  cc_rejected_bad_filled_security_code: "Revisá el código de seguridad (CVV).",
  cc_rejected_call_for_authorize: "Tu banco pide que autorices el pago directamente con ellos.",
  cc_rejected_card_disabled: "La tarjeta está deshabilitada para compras online. Contactá a tu banco.",
  cc_rejected_duplicated_payment: "Ya se registró un pago con estos mismos datos.",
  cc_rejected_insufficient_amount: "Saldo o límite insuficiente.",
  cc_rejected_invalid_installments: "Ese medio de pago no admite cuotas.",
  cc_rejected_max_attempts: "Se alcanzó el límite de intentos permitidos con esta tarjeta.",
  cc_rejected_blacklist: "El sistema antifraude bloqueó el pago.",
  cc_rejected_high_risk: "El sistema antifraude marcó el pago como riesgo alto.",
  cc_rejected_other_reason: "Rechazo del banco sin motivo específico — probá con otro medio de pago.",
};

/** Human-readable labels for Mercado Pago's `payment_method_id` codes. */
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  yape: "Yape",
  account_money: "Dinero en cuenta MP",
  pagoefectivo_atm: "PagoEfectivo",
  debvisa: "Débito Visa",
  debmaster: "Débito Mastercard",
  visa: "Visa",
  master: "Mastercard",
  amex: "American Express",
  diners: "Diners Club",
};
