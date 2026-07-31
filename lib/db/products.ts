import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Product, ProductWithCategory, PriceUsdMode } from "@/lib/types";

const WITH_CATEGORY_SELECT = "*, category:categories(*)";

export async function getPublishedProducts(options?: {
  categoryId?: string;
}): Promise<ProductWithCategory[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("products")
    .select(WITH_CATEGORY_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (options?.categoryId) {
    query = query.eq("category_id", options.categoryId);
  }

  const { data, error } = await query;
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
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as ProductWithCategory[];
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

export interface ProductInput {
  category_id: string | null;
  title: string;
  slug: string;
  description?: string | null;
  price_cents: number;
  currency: string;
  cover_image_path?: string | null;
  file_path: string;
  status: "draft" | "published";
  price_usd_mode?: PriceUsdMode;
  price_usd_manual_cents?: number | null;
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

export async function deleteProduct(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}
