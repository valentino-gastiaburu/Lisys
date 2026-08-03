import "server-only";
import type { Product } from "@/lib/types";
import { getChildProducts } from "@/lib/db/products";
import { getSignedDownloadUrl } from "@/lib/storage/files";

export interface Deliverable {
  label: string;
  url: string;
}

async function ownUrl(product: Product): Promise<string | null> {
  if (product.delivery_type === "link") return product.external_link;
  return product.file_path ? await getSignedDownloadUrl(product.file_path) : null;
}

/**
 * A course or a module can have its own single link (e.g. a Drive folder
 * with everything already bundled) — if set, buying it hands over just that
 * one link. Only when nothing is configured on the product itself does
 * delivery fall back to bundling every descendant leaf's link instead
 * (course -> modules -> videos). This makes "give me every link" opt-in
 * rather than the default.
 */
export async function getDeliverables(product: Product): Promise<Deliverable[]> {
  const url = await ownUrl(product);
  if (url) return [{ label: product.title, url }];

  const children = await getChildProducts(product.id);
  if (children.length === 0) return [];

  // Skip the module-name prefix when there's only one module — mirrors the
  // storefront rule of not showing a "Módulo 1" heading in that case.
  const prefixWithParentTitle = children.length > 1;
  const deliverables: Deliverable[] = [];

  for (const child of children) {
    const childUrl = await ownUrl(child);
    if (childUrl) {
      deliverables.push({ label: child.title, url: childUrl });
      continue;
    }

    const grandchildren = await getChildProducts(child.id);
    for (const grandchild of grandchildren) {
      const grandchildUrl = await ownUrl(grandchild);
      if (grandchildUrl) {
        deliverables.push({
          label: prefixWithParentTitle ? `${child.title} – ${grandchild.title}` : grandchild.title,
          url: grandchildUrl,
        });
      }
    }
  }

  return deliverables;
}
