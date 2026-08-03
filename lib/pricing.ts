import type { Product } from "@/lib/types";
import type { StoreSettings } from "@/lib/db/settings";

/**
 * PayPal doesn't support PEN, so every product needs a USD price. By default
 * it's derived from the Sol price with a simple store-wide formula
 * (round_up((soles + add) / divide)), but each product can override it with
 * a fixed manual USD price instead — see `price_usd_mode`.
 */
export function computeUsdCents(product: Product, settings: StoreSettings): number {
  if (product.price_usd_mode === "manual" && product.price_usd_manual_cents != null) {
    return product.price_usd_manual_cents;
  }

  const soles = product.price_cents / 100;
  const dollars = Math.ceil((soles + settings.usd_formula_add) / settings.usd_formula_divide);
  return dollars * 100;
}

/**
 * A module's price is derived from its course's price divided by the
 * sibling count, plus a markup — same formula for a video derived from its
 * module — so buying a piece always costs more than buying its parent
 * whole. Computed once at creation/edit time, not as an ongoing cascade.
 */
export function computeChildPriceCents(
  parentEffectivePriceCents: number,
  siblingCountIncludingNew: number,
  markupCents: number
): number {
  return Math.ceil(parentEffectivePriceCents / siblingCountIncludingNew) + markupCents;
}
