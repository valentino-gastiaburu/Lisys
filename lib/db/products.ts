import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product, ProductWithCategory, PriceUsdMode, ProductType, PriceMode, DeliveryType } from "@/lib/types";

const WITH_CATEGORY_SELECT = "*, category:categories(*)";

export async function getPublishedProducts(): Promise<ProductWithCategory[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(WITH_CATEGORY_SELECT)
    .eq("status", "published")
    .is("parent_product_id", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as ProductWithCategory[];
}

export async function getPublishedProductBySlug(
  slug: string
): Promise<ProductWithCategory | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(WITH_CATEGORY_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return data as unknown as ProductWithCategory | null;
}

export async function getAllProductsForAdmin(): Promise<ProductWithCategory[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select(WITH_CATEGORY_SELECT)
    .is("parent_product_id", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as ProductWithCategory[];
}

/** A course's modules, or a module's videos — siblings share `parent_product_id`. */
export async function getChildProducts(parentId: string): Promise<Product[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("parent_product_id", parentId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getProductByIdForAdmin(id: string): Promise<Product | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getProductByIdForCheckout(id: string): Promise<Product | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Batch version for cart checkout — one round trip instead of N. */
export async function getProductsByIdsForCheckout(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("id", ids)
    .eq("status", "published");

  if (error) throw error;
  return data;
}

/**
 * Whether a product can be bought on its own. Simple products and whole
 * courses always can (the caller already filtered those to `status ===
 * "published"`); a module/video additionally depends on:
 * - the parent course's `allow_module_purchase`/`allow_video_purchase`
 *   toggle, which the admin can flip after the item was already added to
 *   someone's cart, and
 * - every ancestor (module, and course) still being `published` — a
 *   module/video row can keep its own `status: "published"` even after the
 *   admin drafts/deactivates the *course* it belongs to, since unpublishing
 *   a course doesn't cascade to its children. Without this check, a stale
 *   link (or an item already sitting in someone's cart) could still be
 *   bought straight through even though the course was taken down.
 */
export async function isCartItemPurchasable(product: Product): Promise<boolean> {
  if (product.product_type === "simple" || product.product_type === "course") return true;
  if (!product.parent_product_id) return false;

  const parent = await getProductByIdForAdmin(product.parent_product_id);
  if (!parent || parent.status !== "published") return false;

  if (product.product_type === "module") return parent.allow_module_purchase;

  if (product.product_type === "video") {
    // A video's parent is a module; the purchase toggle lives on the course
    // two levels up.
    if (parent.product_type !== "module" || !parent.parent_product_id) return false;
    const course = await getProductByIdForAdmin(parent.parent_product_id);
    if (!course || course.status !== "published") return false;
    return course.allow_video_purchase;
  }

  return false;
}

export interface ProductInput {
  category_id: string | null;
  title: string;
  slug: string;
  description?: string | null;
  price_cents: number;
  currency: string;
  cover_image_path?: string | null;
  file_path?: string | null;
  status: "draft" | "published" | "inactive";
  price_usd_mode?: PriceUsdMode;
  price_usd_manual_cents?: number | null;
  parent_product_id?: string | null;
  product_type?: ProductType;
  position?: number;
  price_mode?: PriceMode;
  delivery_type?: DeliveryType;
  external_link?: string | null;
  allow_module_purchase?: boolean;
  allow_video_purchase?: boolean;
  is_preview?: boolean;
  compare_at_price_cents?: number | null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateProduct(
  id: string,
  input: Partial<ProductInput>
): Promise<Product> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("products")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

