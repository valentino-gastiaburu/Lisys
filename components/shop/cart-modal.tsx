"use client";

import { useCart } from "@/components/shop/cart-context";
import { CartPanel } from "@/components/shop/cart-panel";

export function CartModal() {
  const { isOpen, closeCart } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6" onClick={closeCart}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Tu carrito</h2>
          <button
            type="button"
            onClick={closeCart}
            aria-label="Cerrar"
            className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-900 dark:hover:text-zinc-300"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-4">
          <CartPanel />
        </div>
      </div>
    </div>
  );
}
