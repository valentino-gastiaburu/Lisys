import { NextRequest, NextResponse } from "next/server";
import { getProductByIdForCheckout } from "@/lib/db/products";
import { createPreference } from "@/lib/payments/mercadopago";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const productId = formData.get("product_id");
  const email = formData.get("email");
  const fullName = formData.get("full_name");

  if (typeof productId !== "string" || typeof email !== "string") {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const product = await getProductByIdForCheckout(productId);
  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const checkoutUrl = await createPreference({
    product,
    buyerEmail: email,
    buyerName: typeof fullName === "string" ? fullName : undefined,
  });

  return NextResponse.redirect(checkoutUrl, { status: 303 });
}
