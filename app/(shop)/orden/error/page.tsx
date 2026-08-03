import Link from "next/link";
import { fetchPayment, REJECTION_REASONS } from "@/lib/payments/mercadopago";

export const dynamic = "force-dynamic";

export default async function OrderErrorPage({
  searchParams,
}: {
  searchParams: Promise<{
    payment_id?: string;
    collection_id?: string;
    status?: string;
    cart_id?: string;
  }>;
}) {
  const params = await searchParams;
  const paymentId = params.payment_id ?? params.collection_id;
  const cartId = params.cart_id;

  const payment = paymentId ? await fetchPayment(paymentId).catch(() => null) : null;

  if (payment) {
    // Server-side record even if the buyer never comes back to look at this page.
    console.error("Pago rechazado", {
      paymentId: payment.id,
      status: payment.status,
      statusDetail: payment.statusDetail,
      externalReference: payment.externalReference,
    });
  }

  const friendlyReason = payment ? REJECTION_REASONS[payment.statusDetail] : null;

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-20 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="mt-5 text-2xl font-bold tracking-tight">Tu pago no se pudo procesar</h1>

      {friendlyReason ? (
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{friendlyReason}</p>
      ) : (
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Mercado Pago rechazó el pago. Prueba con otro medio de pago o vuelve a intentar en unos
          minutos.
        </p>
      )}

      {payment && (
        <p className="mt-4 rounded bg-zinc-100 px-3 py-1.5 font-mono text-xs text-zinc-500 dark:bg-zinc-900">
          {payment.statusDetail || payment.status}
        </p>
      )}

      {cartId && (
        <Link
          href="/carrito"
          className="mt-6 rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-zinc-900 transition hover:bg-emerald-400"
        >
          Volver a intentar
        </Link>
      )}
    </main>
  );
}
