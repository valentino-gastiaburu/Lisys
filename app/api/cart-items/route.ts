import { NextRequest, NextResponse } from "next/server";
import { getProductsByIdsForCheckout, isCartItemPurchasable, getProductByIdForAdmin } from "@/lib/db/products";
import { getStoreSettings } from "@/lib/db/settings";
import { computeUsdCents } from "@/lib/pricing";
import { getPublicCoverUrl } from "@/lib/storage/files";
import { shouldShowSoles } from "@/lib/geo";
import { MAX_CART_ITEMS } from "@/lib/cart/constants";
import type { Product, ProductType } from "@/lib/types";

export interface CartItemView {
  id: string;
  title: string;
  price_cents: number;
  currency: string;
  usdCents: number;
  coverUrl: string | null;
  productType: ProductType;
  /** Set when the item is a module or a video — the course it belongs to. */
  courseTitle: string | null;
  /** Set only when the item is a video — the module it belongs to. */
  moduleTitle: string | null;
}

async function getParentContext(
  product: Product
): Promise<{ courseTitle: string | null; moduleTitle: string | null }> {
  if (product.product_type === "module") {
    const course = product.parent_product_id
      ? await getProductByIdForAdmin(product.parent_product_id)
      : null;
    return { courseTitle: course?.title ?? null, moduleTitle: null };
  }

  if (product.product_type === "video") {
    const productModule = product.parent_product_id
      ? await getProductByIdForAdmin(product.parent_product_id)
      : null;
    const course = productModule?.parent_product_id
      ? await getProductByIdForAdmin(productModule.parent_product_id)
      : null;
    return { courseTitle: course?.title ?? null, moduleTitle: productModule?.title ?? null };
  }

  return { courseTitle: null, moduleTitle: null };
}

export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");
  const ids = idsParam ? idsParam.split(",").filter(Boolean).slice(0, MAX_CART_ITEMS) : [];
  const showSoles = await shouldShowSoles();
  if (ids.length === 0) return NextResponse.json({ items: [], showSoles });

  const [products, settings] = await Promise.all([
    getProductsByIdsForCheckout(ids),
    getStoreSettings(),
  ]);

  const byId = new Map(products.map((p) => [p.id, p]));
  const items: CartItemView[] = [];

  // Preserve the order the ids were passed in (the order items were added
  // to the cart), and silently drop anything no longer published or no
  // longer purchasable on its own (e.g. the admin turned off module sales).
  for (const id of ids) {
    const product = byId.get(id);
    if (!product) continue;
    if (!(await isCartItemPurchasable(product))) continue;

    const { courseTitle, moduleTitle } = await getParentContext(product);

    items.push({
      id: product.id,
      title: product.title,
      price_cents: product.price_cents,
      currency: product.currency,
      usdCents: computeUsdCents(product, settings),
      coverUrl: product.cover_image_path ? getPublicCoverUrl(product.cover_image_path) : null,
      productType: product.product_type,
      courseTitle,
      moduleTitle,
    });
  }

  return NextResponse.json({ items, showSoles });
}
