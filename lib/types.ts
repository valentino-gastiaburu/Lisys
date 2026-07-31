export type ProductStatus = "draft" | "published";
export type OrderStatus = "pending" | "paid" | "refunded";
export type PriceUsdMode = "calculated" | "manual";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  cover_image_path: string | null;
  file_path: string;
  status: ProductStatus;
  price_usd_mode: PriceUsdMode;
  price_usd_manual_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface ProductWithCategory extends Product {
  category: Category | null;
}

export interface Order {
  id: string;
  product_id: string;
  buyer_email: string;
  amount_cents: number;
  currency: string;
  provider_order_id: string | null;
  status: OrderStatus;
  created_at: string;
}
