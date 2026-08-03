"use client";

import { useEffect } from "react";
import { useCart } from "@/components/shop/cart-context";

/** Empties the local cart once a purchase is confirmed, so the header's cart count doesn't linger. */
export function ClearCartOnSuccess() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
