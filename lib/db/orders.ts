import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Order, OrderStatus } from "@/lib/types";

export interface CreateOrderInput {
  product_id: string;
  buyer_email: string;
  amount_cents: number;
  currency: string;
  provider_order_id: string;
  status?: OrderStatus;
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

export async function getOrderByProviderOrderId(
  providerOrderId: string
): Promise<Order | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();

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
