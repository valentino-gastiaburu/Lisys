import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, fetchPayment } from "@/lib/payments/mercadopago";
import { createOrder, hasOrdersForProviderOrderId } from "@/lib/db/orders";
import { getCartById, updateCartStatus } from "@/lib/db/carts";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getDeliverables, type Deliverable } from "@/lib/delivery";
import { sendDownloadEmail } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const dataId = request.nextUrl.searchParams.get("data.id");

  if (type !== "payment" || !dataId) {
    // Mercado Pago also sends other topics (merchant_order, etc.) we don't need.
    return NextResponse.json({ ok: true });
  }

  const isValid = verifyWebhookSignature({
    dataId,
    xSignature: request.headers.get("x-signature"),
    xRequestId: request.headers.get("x-request-id"),
  });

  if (!isValid) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const payment = await fetchPayment(dataId);

  // "pending"/"in_process"/"authorized" aren't final — don't record an
  // attempt yet, since a later notification for the same payment id will
  // carry the real outcome.
  const isTerminal = payment.status === "approved" || payment.status === "rejected" ||
    payment.status === "cancelled";
  if (!isTerminal) {
    console.warn("Pago de Mercado Pago no finalizado todavía", {
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.statusDetail,
    });
    return NextResponse.json({ ok: true });
  }

  const cartId = payment.externalReference;
  const cart = cartId ? await getCartById(cartId) : null;

  if (!cart) {
    console.error("Pago de Mercado Pago sin carrito asociado", { paymentId: payment.id, cartId });
    return NextResponse.json({ ok: true });
  }

  // Mercado Pago redelivers notifications for the SAME payment id — dedupe
  // on that, not on cart.status. A buyer can retry with a different card
  // after a rejection using the same preference/cart, which produces a
  // second payment id for the same cart; keying off cart.status would make
  // that successful retry silently vanish once the first attempt had
  // already flipped the cart to "rejected".
  if (await hasOrdersForProviderOrderId(payment.id)) {
    return NextResponse.json({ ok: true });
  }

  const buyerEmail = payment.payerEmail.toLowerCase();

  if (payment.status !== "approved") {
    // Logged even if the buyer never lands on /orden/error, so rejections
    // are visible in Netlify's function logs for diagnosing new-account
    // anti-fraud rejections.
    console.warn("Pago rechazado", {
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.statusDetail,
    });
    for (const item of cart.items) {
      await createOrder({
        product_id: item.product_id,
        buyer_email: buyerEmail,
        amount_cents: item.price_cents,
        currency: item.currency,
        provider_order_id: payment.id,
        provider: "mercadopago",
        payment_method: payment.paymentMethodId,
        status_detail: payment.statusDetail,
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
      buyer_email: payment.payerEmail,
      amount_cents: item.price_cents,
      currency: item.currency,
      provider_order_id: payment.id,
      provider: "mercadopago",
      payment_method: payment.paymentMethodId,
      status_detail: payment.statusDetail,
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
