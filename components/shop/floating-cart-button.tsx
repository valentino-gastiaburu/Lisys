"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/components/shop/cart-context";
import { useCartItems } from "@/lib/cart/use-cart-items";
import { CartIcon } from "@/components/shop/cart-icon";
import { formatPrice } from "@/lib/format";

export function FloatingCartButton() {
  const { count, openCart } = useCart();
  const { items, showSoles } = useCartItems();
  const [bump, setBump] = useState(false);
  const prevCount = useRef(count);

  useEffect(() => {
    if (count > prevCount.current) {
      setBump(true);
      const timeout = setTimeout(() => setBump(false), 400);
      prevCount.current = count;
      return () => clearTimeout(timeout);
    }
    prevCount.current = count;
  }, [count]);

  if (count === 0) return null;

  const totalCents = items?.reduce((sum, item) => sum + item.price_cents, 0) ?? 0;
  const totalUsdCents = items?.reduce((sum, item) => sum + item.usdCents, 0) ?? 0;
  const currency = items?.[0]?.currency;

  return (
    <div className="fixed bottom-10 right-8 z-40 flex flex-col items-end gap-2 sm:bottom-12 sm:right-10">
      {/* Always-visible summary of what's in the cart so far — no click needed. */}
      {items && items.length > 0 && (
        <div className="w-72 max-w-[85vw] rounded-xl border border-emerald-200 bg-white p-3 shadow-xl dark:border-emerald-900 dark:bg-zinc-950">
          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
            En tu carrito
          </p>
          <div className="mt-1.5 flex flex-col gap-1">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-1.5 text-xs">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                <p className="flex-1 truncate text-zinc-600 dark:text-zinc-400">{item.title}</p>
                <span className="shrink-0 font-medium text-zinc-800 dark:text-zinc-200">
                  {formatPrice(item.usdCents, "USD")}
                </span>
              </div>
            ))}
          </div>
          {currency && (
            <p className="mt-1.5 border-t border-zinc-100 pt-1.5 text-xs font-semibold text-zinc-800 dark:border-zinc-800 dark:text-zinc-200">
              Total: {formatPrice(totalUsdCents, "USD")}
              {showSoles && currency === "PEN" && ` (${formatPrice(totalCents, currency)})`}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={openCart}
        className={`flex items-center gap-2 rounded-full bg-emerald-500 px-6 py-3.5 font-semibold text-zinc-900 shadow-xl ring-4 ring-emerald-300/50 transition-transform duration-300 hover:bg-emerald-400 dark:ring-emerald-500/30 ${
          bump ? "scale-110" : "scale-100"
        }`}
      >
        <CartIcon className="h-5 w-5" />
        Ver carrito
        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-zinc-900 px-1.5 text-sm font-bold text-white">
          {count}
        </span>
      </button>
    </div>
  );
}
