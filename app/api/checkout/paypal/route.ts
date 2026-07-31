import { NextRequest, NextResponse } from "next/server";
import { getProductByIdForCheckout } from "@/lib/db/products";
import { getStoreSettings } from "@/lib/db/settings";
import { computeUsdCents } from "@/lib/pricing";
import { createOrder } from "@/lib/payments/paypal";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const productId = formData.get("product_id");
  const email = formData.get("email");

  if (typeof productId !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const product = await getProductByIdForCheckout(productId);
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const settings = await getStoreSettings();
  const usdCents = computeUsdCents(product, settings);

  const { approveUrl } = await createOrder({ product, usdCents, buyerEmail: email });

  return NextResponse.redirect(approveUrl, { status: 303 });
}
