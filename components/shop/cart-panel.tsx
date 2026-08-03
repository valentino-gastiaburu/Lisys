"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/shop/cart-context";
import { useCartItems } from "@/lib/cart/use-cart-items";
import { formatPrice } from "@/lib/format";
import type { CartItemView } from "@/app/api/cart-items/route";

const PRODUCT_TYPE_LABELS: Record<CartItemView["productType"], string> = {
  simple: "Producto",
  course: "Curso",
  module: "Módulo",
  video: "Video",
};

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0">
      <path
        fillRule="evenodd"
        d="M10 1a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V5a4 4 0 0 0-4-4Zm2 6V5a2 2 0 1 0-4 0v2h4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** The cart contents + checkout form — used both by the full /carrito page and the floating cart popup. */
export function CartPanel() {
  const { remove } = useCart();
  const { items, showSoles } = useCartItems();

  if (items === null) {
    return <p className="py-10 text-center text-sm text-zinc-500">Cargando carrito…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <p className="font-medium">Tu carrito está vacío</p>
        <p className="mt-1 text-sm text-zinc-500">
          Agrega un curso, un módulo o un video desde el catálogo.
        </p>
        <Link
          href="/"
          className="mt-5 rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-400"
        >
          Ir al catálogo
        </Link>
      </div>
    );
  }

  const totalCents = items.reduce((sum, item) => sum + item.price_cents, 0);
  const totalUsdCents = items.reduce((sum, item) => sum + item.usdCents, 0);
  const currency = items[0].currency;

  return (
    <div>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-900">
              {item.coverUrl && (
                <Image src={item.coverUrl} alt={item.title} fill className="object-cover" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {PRODUCT_TYPE_LABELS[item.productType]}
                </span>
                <p className="text-sm font-medium">{item.title}</p>
              </div>
              {(item.courseTitle || item.moduleTitle) && (
                <p className="mt-0.5 text-xs text-zinc-400">
                  {item.productType === "video"
                    ? `De: ${item.courseTitle} → ${item.moduleTitle}`
                    : `De: ${item.courseTitle}`}
                </p>
              )}
              <p className="text-sm text-zinc-500">{formatPrice(item.price_cents, item.currency)}</p>
            </div>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="text-xs text-zinc-400 underline hover:text-red-500"
            >
              Quitar
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-zinc-500">Total</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatPrice(totalUsdCents, "USD")}
            {showSoles && currency === "PEN" && (
              <span className="ml-1.5 text-sm font-medium text-zinc-400">
                ({formatPrice(totalCents, currency)})
              </span>
            )}
          </span>
        </div>

        <form method="POST" className="mt-6 flex flex-col gap-3">
          {items.map((item) => (
            <input key={item.id} type="hidden" name="product_id" value={item.id} />
          ))}

          <label className="text-sm font-medium">
            Nombre completo
            <input
              type="text"
              name="full_name"
              required
              placeholder="Tu nombre y apellido"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="text-sm font-medium">
            Tu email
            <input
              type="email"
              name="email"
              required
              placeholder="tu@email.com"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>

          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              type="submit"
              formAction="/api/checkout"
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-3 font-semibold text-zinc-900 transition hover:bg-emerald-400"
            >
              <LockIcon />
              MP ({formatPrice(totalCents, currency)})
            </button>
            <button
              type="submit"
              formAction="/api/checkout/paypal"
              className="flex items-center justify-center gap-2 rounded-lg border-2 border-[#003087] px-3 py-3 font-semibold text-[#003087] transition hover:bg-[#003087]/5 dark:border-[#4593e0] dark:text-[#4593e0]"
            >
              <LockIcon />
              PayPal ({formatPrice(totalUsdCents, "USD")})
            </button>
          </div>
          <p className="text-center text-xs text-zinc-500">
            Tarjeta o Yape en soles con Mercado Pago, o en dólares con PayPal.
          </p>
        </form>
      </div>
    </div>
  );
}
