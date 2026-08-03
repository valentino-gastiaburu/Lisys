"use client";

import { useEffect, useState } from "react";
import { useCart } from "@/components/shop/cart-context";
import type { CartItemView } from "@/app/api/cart-items/route";

interface CartItemsResult {
  items: CartItemView[] | null;
  /** Whether to show soles alongside dollars — geo-detected server-side, defaults to true (show both) while loading. */
  showSoles: boolean;
}

/** Fetches live product data for whatever's in the cart — null while loading. Shared by the cart panel and the floating summary so both always agree. */
export function useCartItems(): CartItemsResult {
  const { ids, setIds } = useCart();
  const [items, setItems] = useState<CartItemView[] | null>(null);
  const [showSoles, setShowSoles] = useState(true);

  useEffect(() => {
    if (ids.length === 0) {
      setItems([]);
      return;
    }

    let cancelled = false;
    fetch(`/api/cart-items?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data: { items: CartItemView[]; showSoles: boolean }) => {
        if (cancelled) return;
        setItems(data.items);
        setShowSoles(data.showSoles);

        // Ids that came back missing were dropped server-side (no longer
        // published, or the admin turned off module/video purchase) — keep
        // the local cart in sync silently.
        const validIds = data.items.map((item) => item.id);
        if (validIds.length !== ids.length) setIds(validIds);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids.join(",")]);

  return { items, showSoles };
}
