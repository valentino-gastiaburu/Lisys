import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, captureOrder } from "@/lib/payments/paypal";
import { createOrder, hasOrdersForProviderOrderId } from "@/lib/db/orders";
import { getCartById, updateCartStatus } from "@/lib/db/carts";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getDeliverables, type Deliverable } from "@/lib/delivery";
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
  const capture = await captureOrder(orderId);

  const cart = capture.cartId ? await getCartById(capture.cartId) : null;
  if (!cart) {
    console.error("Captura de PayPal sin carrito asociado", { orderId, cartId: capture.cartId });
    return NextResponse.json({ ok: true });
  }

  // PayPal redelivers webhooks for the SAME order id — dedupe on that
  // (mirrors the Mercado Pago webhook), not on cart.status, so a capture
  // retry that later succeeds is never silently dropped just because an
  // earlier attempt already flipped the cart to "rejected".
  if (await hasOrdersForProviderOrderId(orderId)) {
    return NextResponse.json({ ok: true });
  }

  const buyerEmail = capture.payerEmail.toLowerCase();

  if (capture.status !== "COMPLETED") {
    console.warn("Captura de PayPal rechazada", { orderId, status: capture.status, reason: capture.declineReason });
    for (const item of cart.items) {
      await createOrder({
        product_id: item.product_id,
        buyer_email: buyerEmail,
        amount_cents: item.price_cents,
        currency: item.currency,
        provider_order_id: orderId,
        provider: "paypal",
        payment_method: capture.paymentMethod,
        status_detail: capture.declineReason,
        status: "rejected",
        cart_id: cart.id,
      });
    }
    // Don't downgrade a cart a previous (out-of-order) notification already
    // marked "paid" — this attempt's rejection doesn't undo that.
    if (cart.status === "pending") await updateCartStatus(cart.id, "rejected");
    return NextResponse.json({ ok: true });
  }

  for (const item of cart.items) {
    await createOrder({
      product_id: item.product_id,
      buyer_email: capture.payerEmail,
      amount_cents: item.price_cents,
      currency: item.currency,
      provider_order_id: orderId,
      provider: "paypal",
      payment_method: capture.paymentMethod,
      status_detail: capture.declineReason,
      status: "paid",
      cart_id: cart.id,
    });
  }
  await updateCartStatus(cart.id, "paid");

  const deliverables: Deliverable[] = [];
  for (const item of cart.items) {
    const product = await getProductByIdForAdmin(item.product_id);
    if (product) deliverables.push(...(await getDeliverables(product)));
  }
  await sendDownloadEmail({
    to: buyerEmail,
    productTitle: cart.items.length === 1 ? cart.items[0].title : "tu compra en Lisys",
    items: deliverables,
  });

  return NextResponse.json({ ok: true });
}
