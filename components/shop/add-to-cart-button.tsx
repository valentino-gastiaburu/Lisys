"use client";

import { useCart } from "@/components/shop/cart-context";
import { formatPrice } from "@/lib/format";

const SIZE_CLASSES = {
  default: "gap-1.5 rounded-lg px-3 py-1.5 text-sm",
  compact: "gap-1 rounded-md px-2.5 py-1 text-xs",
} as const;

const CHIP_CLASSES =
  "inline-flex items-center border font-medium transition cursor-pointer " +
  "border-zinc-300 bg-white text-zinc-700 hover:border-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 " +
  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-500 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-400 " +
  "disabled:cursor-default disabled:border-emerald-300 disabled:bg-emerald-50 disabled:text-emerald-700 disabled:hover:bg-emerald-50 " +
  "dark:disabled:border-emerald-800 dark:disabled:bg-emerald-950/40 dark:disabled:text-emerald-400";

function PlusIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10l4 4 8-8" />
    </svg>
  );
}

export function AddToCartButton({
  productId,
  priceCents,
  currency,
  variant = "default",
}: {
  productId: string;
  /** Shown after the label on the primary variant, e.g. "Añadir al carrito — S/70.00". */
  priceCents?: number;
  currency?: string;
  variant?: "primary" | "default" | "compact";
}) {
  const { add, ids } = useCart();
  const inCart = ids.includes(productId);

  if (variant === "primary") {
    return (
      <button
        type="button"
        onClick={() => add(productId)}
        disabled={inCart}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-zinc-900 shadow-sm transition hover:bg-emerald-400 hover:shadow disabled:cursor-default disabled:bg-emerald-600 disabled:text-white disabled:shadow-none"
      >
        {inCart ? (
          <>
            <CheckIcon className="h-5 w-5" />
            Añadido al carrito
          </>
        ) : (
          <>
            Añadir al carrito
            {priceCents != null && currency ? ` — ${formatPrice(priceCents, currency)}` : ""}
          </>
        )}
      </button>
    );
  }

  const iconSize = variant === "compact" ? "h-3 w-3" : "h-3.5 w-3.5";

  return (
    <button
      type="button"
      onClick={() => add(productId)}
      disabled={inCart}
      className={`${CHIP_CLASSES} ${SIZE_CLASSES[variant]}`}
    >
      {inCart ? (
        <>
          <CheckIcon className={iconSize} />
          Añadido
        </>
      ) : (
        <>
          <PlusIcon className={iconSize} />
          Añadir al carrito
        </>
      )}
    </button>
  );
}
