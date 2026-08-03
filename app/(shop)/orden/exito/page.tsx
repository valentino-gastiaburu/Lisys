import { fetchPayment } from "@/lib/payments/mercadopago";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getCartById, getCartByProviderOrderId } from "@/lib/db/carts";
import { getDeliverables, type Deliverable } from "@/lib/delivery";
import { ClearCartOnSuccess } from "@/components/shop/clear-cart-on-success";
import type { Cart } from "@/lib/types";

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
    const cart = await getCartById(payment.externalReference);
    if (cart) return { found: true as const, cart };
  }
  return { found: false as const, stillPending: true };
}

async function resolvePaypal(providerOrderId: string) {
  // Capture only happens in the webhook (CHECKOUT.ORDER.APPROVED), so this
  // page just watches for the cart to flip out of "pending".
  for (let attempt = 0; attempt < POLL_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(POLL_DELAY_MS);

    const cart = await getCartByProviderOrderId(providerOrderId);
    if (cart?.status === "paid") return { found: true as const, cart };
  }
  return { found: false as const, stillPending: true };
}

async function loadDeliverables(cart: Cart): Promise<Deliverable[]> {
  const deliverables: Deliverable[] = [];
  for (const item of cart.items) {
    const product = await getProductByIdForAdmin(item.product_id);
    if (product) deliverables.push(...(await getDeliverables(product)));
  }
  return deliverables;
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

  let deliverables: Deliverable[] = [];
  let productTitle: string | null = null;
  let stillPending = false;

  const result = mpPaymentId
    ? await resolveMercadoPago(mpPaymentId)
    : paypalOrderId
      ? await resolvePaypal(paypalOrderId)
      : null;

  if (result?.found) {
    productTitle = result.cart.items.length === 1 ? result.cart.items[0].title : null;
    deliverables = await loadDeliverables(result.cart);
  } else if (result?.stillPending) {
    stillPending = true;
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-20 text-center">
      {deliverables.length > 0 && <ClearCartOnSuccess />}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight">
        {deliverables.length > 0 ? "¡Gracias por tu compra!" : stillPending ? "Estamos confirmando tu pago" : "Gracias"}
      </h1>

      {deliverables.length === 1 ? (
        <>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{productTitle}</span>{" "}
            está lista para descargar.
          </p>
          <a
            href={deliverables[0].url}
            className="mt-6 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-900 transition hover:bg-emerald-400"
          >
            Descargar ahora
          </a>
          <p className="mt-3 text-xs text-zinc-500">
            También te enviamos este link por email, por si el link expira.
          </p>
        </>
      ) : deliverables.length > 1 ? (
        <>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {productTitle ? (
              <>
                <span className="font-medium text-zinc-900 dark:text-zinc-100">{productTitle}</span>{" "}
                ya está listo.
              </>
            ) : (
              "Tu pedido ya está listo."
            )}
          </p>
          <div className="mt-6 flex w-full flex-col gap-2">
            {deliverables.map((item) => (
              <a
                key={item.url}
                href={item.url}
                className="rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-900 transition hover:bg-emerald-400"
              >
                {item.label}
              </a>
            ))}
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            También te enviamos estos links por email, por si alguno expira.
          </p>
        </>
      ) : (
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          En unos minutos te va a llegar un email con el link de descarga. Si no te llega,
          escríbenos.
        </p>
      )}
    </main>
  );
}
