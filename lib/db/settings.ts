import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export interface StoreSettings {
  usd_formula_add: number;
  usd_formula_divide: number;
  hero_title: string;
  hero_description: string;
  hero_image_path: string | null;
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("usd_formula_add, usd_formula_divide, hero_title, hero_description, hero_image_path")
    .eq("id", true)
    .single();

  if (error) throw error;
  return data;
}

export async function updateStoreSettings(input: Partial<StoreSettings>): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("store_settings").update(input).eq("id", true);
  if (error) throw error;
}
