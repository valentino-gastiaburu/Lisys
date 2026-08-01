import { fetchPayment } from "@/lib/payments/mercadopago";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getOrderByProviderOrderId } from "@/lib/db/orders";
import { getSignedDownloadUrl } from "@/lib/storage/files";

export const dynamic = "force-dynamic";

const POLL_ATTEMPTS = 4;
const POLL_DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveMercadoPago(paymentId: string) {
  const payment = await fetchPayment(paymentId).catch(() => null);
  if (!payment) return { found: false as const };

  if (payment.status === "approved" && payment.externalReference) {
    const product = await getProductByIdForAdmin(payment.externalReference);
    if (product) return { found: true as const, product };
  }
  return { found: false as const, stillPending: true };
}

async function resolvePaypal(orderId: string) {
  // Capture only happens in the webhook (CHECKOUT.ORDER.APPROVED), so this
  // page just watches for the resulting order row to show up.
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(POLL_DELAY_MS);

    const order = await getOrderByProviderOrderId(orderId);
    if (order?.status === "paid") {
      const product = await getProductByIdForAdmin(order.product_id);
      if (product) return { found: true as const, product };
    }
  }
  return { found: false as const, stillPending: true };
}

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{
    payment_id?: string;
    collection_id?: string;
    token?: string;
  }>;
}) {
  const params = await searchParams;
  const mpPaymentId = params.payment_id ?? params.collection_id;
  const paypalOrderId = params.token;

  let downloadUrl: string | null = null;
  let productTitle: string | null = null;
  let stillPending = false;

  const result = mpPaymentId
    ? await resolveMercadoPago(mpPaymentId)
    : paypalOrderId
      ? await resolvePaypal(paypalOrderId)
      : null;

  if (result?.found) {
    productTitle = result.product.title;
    downloadUrl = await getSignedDownloadUrl(result.product.file_path);
  } else if (result?.stillPending) {
    stillPending = true;
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight">
        {downloadUrl ? "¡Gracias por tu compra!" : stillPending ? "Estamos confirmando tu pago" : "Gracias"}
      </h1>

      {downloadUrl ? (
        <>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{productTitle}</span>{" "}
            está lista para descargar.
          </p>
          <a
            href={downloadUrl}
            className="mt-6 rounded-lg bg-amber-500 px-6 py-3 font-semibold text-zinc-900 transition hover:bg-amber-400"
          >
            Descargar ahora
          </a>
          <p className="mt-3 text-xs text-zinc-500">
            También te enviamos este link por email, por si el link expira.
          </p>
        </>
      ) : (
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          En unos minutos te va a llegar un email con el link de descarga. Si no te llega,
          escribinos.
        </p>
      )}
    </main>
  );
}
