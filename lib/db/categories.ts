import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Category } from "@/lib/types";

export async function getCategories(): Promise<Category[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data;
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export interface CategoryInput {
  name: string;
  slug: string;
  description?: string | null;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .insert(input)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  input: Partial<CategoryInput>
): Promise<Category> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("categories")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}
