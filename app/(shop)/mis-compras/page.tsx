import { getPaidOrdersForEmail } from "@/lib/db/orders";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getDeliverables, type Deliverable } from "@/lib/delivery";
import { resendPurchasesAction } from "@/lib/actions/purchases";

export const dynamic = "force-dynamic";

interface PurchaseView {
  productId: string;
  productTitle: string;
  deliverables: Deliverable[];
}

async function loadPurchases(email: string): Promise<PurchaseView[]> {
  const orders = await getPaidOrdersForEmail(email);
  const seen = new Set<string>();
  const purchases: PurchaseView[] = [];

  for (const order of orders) {
    if (seen.has(order.product_id)) continue;
    seen.add(order.product_id);

    const product = await getProductByIdForAdmin(order.product_id);
    if (!product) continue;

    const deliverables = await getDeliverables(product);
    if (deliverables.length > 0) {
      purchases.push({ productId: product.id, productTitle: product.title, deliverables });
    }
  }

  return purchases;
}

export default async function MyPurchasesPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; resend?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.trim().toLowerCase();
  const purchases = email ? await loadPurchases(email) : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Mis compras</h1>
      <p className="mt-2 text-sm text-zinc-500">
        Ingresa el email que usaste al comprar para ver tus descargas. No necesitas contraseña ni
        cuenta.
      </p>

      <form method="GET" className="mt-6 flex gap-2">
        <input
          type="email"
          name="email"
          required
          defaultValue={email}
          placeholder="tu@email.com"
          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-400"
        >
          Buscar
        </button>
      </form>

      {params.resend === "sent" && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Te enviamos tus compras por correo.
        </p>
      )}
      {params.resend === "cooldown" && (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          Ya te enviamos un correo hoy — puedes volver a pedirlo mañana. Mientras tanto, descarga
          directo desde aquí abajo.
        </p>
      )}

      {purchases !== null && (
        <div className="mt-8">
          {purchases.length === 0 ? (
            <p className="text-sm text-zinc-500">Si ese correo compró algo, lo vas a ver acá.</p>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {purchases.map((purchase) => (
                  <div
                    key={purchase.productId}
                    className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <p className="text-sm font-medium">{purchase.productTitle}</p>
                    <div className="mt-2 flex flex-col gap-1">
                      {purchase.deliverables.map((item) => (
                        <a
                          key={item.url}
                          href={item.url}
                          className="text-sm text-emerald-600 underline dark:text-emerald-400"
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <form action={resendPurchasesAction} className="mt-6">
                <input type="hidden" name="email" value={email} />
                <button type="submit" className="text-sm font-medium text-zinc-600 underline dark:text-zinc-400">
                  Reenviar todo a mi correo
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </main>
  );
}
