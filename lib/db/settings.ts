import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StoreSettings {
  usd_formula_add: number;
  usd_formula_divide: number;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("usd_formula_add, usd_formula_divide")
    .eq("id", true)
    .single();

  if (error) throw error;
  return data;
}

export async function updateStoreSettings(input: StoreSettings): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("store_settings").update(input).eq("id", true);
  if (error) throw error;
}
