import "server-only";
import crypto from "node:crypto";
import type { Product } from "@/lib/types";

const API_BASE = "https://api.mercadopago.com";

export async function createPreference(params: {
  product: Product;
  buyerEmail?: string;
  buyerName?: string;
}): Promise<string> {
  const { product, buyerEmail, buyerName } = params;
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
      items: [
        {
          title: product.title,
          quantity: 1,
          unit_price: product.price_cents / 100,
          currency_id: product.currency,
        },
      ],
      // Mercado Pago has no way to create a product ahead of time like a
      // Gumroad/Lemon Squeezy catalog — this ties the preference back to our
      // own product row for the webhook and the success page.
      external_reference: product.id,
      payer: buyerEmail ? { email: buyerEmail, name, surname } : undefined,
      back_urls: {
        success: `${siteUrl}/orden/exito`,
        pending: `${siteUrl}/orden/exito`,
        failure: `${siteUrl}/producto/${product.slug}`,
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
    transactionAmountCents: Math.round(json.transaction_amount * 100),
    currency: json.currency_id,
    payerEmail: json.payer?.email ?? "",
    externalReference: json.external_reference ?? null,
  };
}
