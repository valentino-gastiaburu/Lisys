export type ProductStatus = "draft" | "published" | "inactive";
export type OrderStatus = "pending" | "paid" | "refunded" | "rejected";
export type PaymentProvider = "mercadopago" | "paypal";
export type PriceUsdMode = "calculated" | "manual";
export type ProductType = "simple" | "course" | "module" | "video";
export type PriceMode = "calculated" | "manual";
export type DeliveryType = "file" | "link";

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
  file_path: string | null;
  status: ProductStatus;
  price_usd_mode: PriceUsdMode;
  price_usd_manual_cents: number | null;
  created_at: string;
  updated_at: string;
  parent_product_id: string | null;
  product_type: ProductType;
  position: number;
  price_mode: PriceMode;
  delivery_type: DeliveryType;
  external_link: string | null;
  allow_module_purchase: boolean;
  allow_video_purchase: boolean;
  is_preview: boolean;
  compare_at_price_cents: number | null;
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
  provider: PaymentProvider;
  payment_method: string | null;
  status_detail: string | null;
  status: OrderStatus;
  cart_id: string | null;
  created_at: string;
}

export type CartStatus = "pending" | "paid" | "rejected";

export interface CartItem {
  product_id: string;
  title: string;
  price_cents: number;
  currency: string;
}

export interface Cart {
  id: string;
  buyer_email: string;
  buyer_name: string | null;
  items: CartItem[];
  status: CartStatus;
  provider: PaymentProvider;
  provider_order_id: string | null;
  created_at: string;
}
