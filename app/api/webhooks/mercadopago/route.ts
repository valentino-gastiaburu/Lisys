import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, fetchPayment } from "@/lib/payments/mercadopago";
import { createOrder, getOrderByProviderOrderId } from "@/lib/db/orders";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getSignedDownloadUrl } from "@/lib/storage/files";
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

  if (payment.status !== "approved") {
    // Logged even if the buyer never lands on /orden/error, so rejections
    // are visible in Netlify's function logs for diagnosing new-account
    // anti-fraud rejections.
    console.warn("Pago no aprobado", {
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.statusDetail,
      externalReference: payment.externalReference,
    });
    return NextResponse.json({ ok: true });
  }

  // Mercado Pago redelivers notifications; skip if we already recorded this payment.
  const existing = await getOrderByProviderOrderId(payment.id);
  if (existing) {
    return NextResponse.json({ ok: true });
  }

  const productId = payment.externalReference;
  const product = productId ? await getProductByIdForAdmin(productId) : null;

  if (!product) {
    console.error("Pago de Mercado Pago sin producto asociado", { paymentId: payment.id, productId });
    return NextResponse.json({ ok: true });
  }

  await createOrder({
    product_id: product.id,
    buyer_email: payment.payerEmail,
    amount_cents: payment.transactionAmountCents,
    currency: payment.currency,
    provider_order_id: payment.id,
    status: "paid",
  });

  const downloadUrl = await getSignedDownloadUrl(product.file_path);
  await sendDownloadEmail({ to: payment.payerEmail, productTitle: product.title, downloadUrl });

  return NextResponse.json({ ok: true });
}
