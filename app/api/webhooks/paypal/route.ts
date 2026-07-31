import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, captureOrder } from "@/lib/payments/paypal";
import { createOrder, getOrderByProviderOrderId } from "@/lib/db/orders";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getSignedDownloadUrl } from "@/lib/storage/files";
import { sendDownloadEmail } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const event = JSON.parse(rawBody);

  const isValid = await verifyWebhookSignature({
    transmissionId: request.headers.get("paypal-transmission-id"),
    transmissionTime: request.headers.get("paypal-transmission-time"),
    certUrl: request.headers.get("paypal-cert-url"),
    authAlgo: request.headers.get("paypal-auth-algo"),
    transmissionSig: request.headers.get("paypal-transmission-sig"),
    webhookEvent: event,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  if (event.event_type !== "CHECKOUT.ORDER.APPROVED") {
    // Only the approval event triggers a capture; other events (denied,
    // voided, etc.) don't need any action here.
    return NextResponse.json({ ok: true });
  }

  const orderId = event.resource.id as string;

  // PayPal redelivers webhooks; skip if we already recorded this order.
  const existing = await getOrderByProviderOrderId(orderId);
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  const capture = await captureOrder(orderId);

  if (capture.status !== "COMPLETED") {
    console.warn("Captura de PayPal no completada", { orderId, status: capture.status });
    return NextResponse.json({ ok: true });
  }

  const product = capture.productId ? await getProductByIdForAdmin(capture.productId) : null;
  if (!product) {
    console.error("Captura de PayPal sin producto asociado", { orderId, productId: capture.productId });
    return NextResponse.json({ ok: true });
  }

  await createOrder({
    product_id: product.id,
    buyer_email: capture.payerEmail,
    amount_cents: capture.amountCents,
    currency: capture.currency,
    provider_order_id: orderId,
    status: "paid",
  });

  const downloadUrl = await getSignedDownloadUrl(product.file_path);
  await sendDownloadEmail({ to: capture.payerEmail, productTitle: product.title, downloadUrl });

  return NextResponse.json({ ok: true });
}
