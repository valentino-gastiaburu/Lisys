import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderStatus, PaymentProvider } from "@/lib/types";

export interface CreateOrderInput {
  product_id: string;
  buyer_email: string;
  amount_cents: number;
  currency: string;
  provider_order_id: string;
  provider: PaymentProvider;
  payment_method?: string | null;
  status_detail?: string | null;
  status?: OrderStatus;
  cart_id?: string | null;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .insert({ status: "pending", ...input })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

/**
 * Whether any order rows already exist for this specific payment/capture
 * attempt — the correct idempotency key for webhook redelivery. A cart can
 * legitimately go from "rejected" to "paid" (a buyer retries with a
 * different card/funding source on the same checkout), so `cart.status`
 * alone is NOT a safe dedupe key: two different `provider_order_id`s can
 * belong to the same cart.
 */
export async function hasOrdersForProviderOrderId(providerOrderId: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("provider_order_id", providerOrderId);

  if (error) throw error;
  return (count ?? 0) > 0;
}

export async function getPaidOrderCountForProduct(productId: string): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("orders")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("status", "paid");

  if (error) throw error;
  return count ?? 0;
}

/** Backs the passwordless "mis compras" lookup — no accounts, just an email. */
export async function getPaidOrdersForEmail(email: string): Promise<Order[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("buyer_email", email.toLowerCase())
    .eq("status", "paid")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export interface OrderWithProductTitle extends Order {
  product: { title: string } | null;
}

export async function getOrdersForAdmin(): Promise<OrderWithProductTitle[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*, product:products(title)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as OrderWithProductTitle[];
}
