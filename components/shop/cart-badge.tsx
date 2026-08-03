"use client";

import { useCart } from "@/components/shop/cart-context";
import { CartIcon } from "@/components/shop/cart-icon";

export function CartBadge() {
  const { count, openCart } = useCart();

  return (
    <button
      type="button"
      onClick={openCart}
      className="flex items-center gap-1.5 transition hover:text-zinc-950 dark:hover:text-white"
    >
      <CartIcon />
      Carrito
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1 text-xs font-bold text-zinc-900">
          {count}
        </span>
      )}
    </button>
  );
}
