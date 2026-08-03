import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Cart, CartItem, CartStatus, PaymentProvider } from "@/lib/types";

export async function createCart(input: {
  buyer_email: string;
  buyer_name?: string | null;
  items: CartItem[];
  provider: PaymentProvider;
}): Promise<Cart> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("carts")
    .insert({ ...input, status: "pending" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getCartById(id: string): Promise<Cart | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("carts").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data;
}

/** Looks up a cart by the provider's own order id (PayPal's `token`) — see 0010_cart_provider_order_id.sql. */
export async function getCartByProviderOrderId(providerOrderId: string): Promise<Cart | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("carts")
    .select("*")
    .eq("provider_order_id", providerOrderId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function setCartProviderOrderId(id: string, providerOrderId: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("carts").update({ provider_order_id: providerOrderId }).eq("id", id);
  if (error) throw error;
}

export async function updateCartStatus(id: string, status: CartStatus): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("carts").update({ status }).eq("id", id);
  if (error) throw error;
}
