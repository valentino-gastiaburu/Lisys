"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  addToCart as addToCartStorage,
  clearCart as clearCartStorage,
  getCartIds,
  removeFromCart as removeFromCartStorage,
  setCartIds as setCartIdsStorage,
  subscribeToCart,
} from "@/lib/cart/storage";

interface CartContextValue {
  ids: string[];
  count: number;
  isOpen: boolean;
  add: (productId: string) => void;
  remove: (productId: string) => void;
  setIds: (ids: string[]) => void;
  clear: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIdsState] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIdsState(getCartIds());
    return subscribeToCart(() => setIdsState(getCartIds()));
  }, []);

  const add = useCallback((productId: string) => setIdsState(addToCartStorage(productId)), []);
  const remove = useCallback((productId: string) => setIdsState(removeFromCartStorage(productId)), []);
  const setIds = useCallback((next: string[]) => {
    setCartIdsStorage(next);
    setIdsState(next);
  }, []);
  const clear = useCallback(() => {
    clearCartStorage();
    setIdsState([]);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  return (
    <CartContext.Provider
      value={{ ids, count: ids.length, isOpen, add, remove, setIds, clear, openCart, closeCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
