import { NextRequest, NextResponse } from "next/server";
import { getProductsByIdsForCheckout, isCartItemPurchasable } from "@/lib/db/products";
import { getStoreSettings } from "@/lib/db/settings";
import { computeUsdCents } from "@/lib/pricing";
import { createCart, setCartProviderOrderId } from "@/lib/db/carts";
import { createOrder } from "@/lib/payments/paypal";
import { MAX_CART_ITEMS } from "@/lib/cart/constants";
import type { CartItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const productIds = [...new Set(formData.getAll("product_id").filter((v) => typeof v === "string"))] as string[];
  const email = formData.get("email");
  const fullName = formData.get("full_name");

  if (
    productIds.length === 0 ||
    productIds.length > MAX_CART_ITEMS ||
    typeof email !== "string" ||
    !email.trim()
  ) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const normalizedEmail = email.trim().toLowerCase();

  const products = await getProductsByIdsForCheckout(productIds);
  if (products.length !== productIds.length) {
    return NextResponse.json({ error: "Uno o más productos ya no están disponibles" }, { status: 400 });
  }

  for (const product of products) {
    if (!(await isCartItemPurchasable(product))) {
      return NextResponse.json({ error: "Uno o más productos ya no se pueden comprar por separado" }, { status: 400 });
    }
  }

  const settings = await getStoreSettings();
  const items: CartItem[] = products.map((product) => ({
    product_id: product.id,
    title: product.title,
    price_cents: product.price_cents,
    currency: product.currency,
  }));
  const itemsWithUsd = products.map((product, i) => ({
    ...items[i],
    usdCents: computeUsdCents(product, settings),
  }));

  const cart = await createCart({
    buyer_email: normalizedEmail,
    buyer_name: typeof fullName === "string" ? fullName : undefined,
    items,
    provider: "paypal",
  });

  const { orderId, approveUrl } = await createOrder({
    cartId: cart.id,
    items: itemsWithUsd,
    buyerEmail: normalizedEmail,
  });
  await setCartProviderOrderId(cart.id, orderId);

  return NextResponse.redirect(approveUrl, { status: 303 });
}
