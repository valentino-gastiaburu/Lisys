import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export const PRODUCT_FILES_BUCKET = "product-files";
export const PRODUCT_COVERS_BUCKET = "product-covers";

const DOWNLOAD_URL_TTL_SECONDS = 60 * 60; // 1 hour

export async function uploadProductFile(path: string, file: File): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(PRODUCT_FILES_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;
}

export async function uploadCoverImage(path: string, file: File): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(PRODUCT_COVERS_BUCKET)
    .upload(path, file, { upsert: true });

  if (error) throw error;
}

export function getPublicCoverUrl(path: string): string {
  const supabase = createAdminClient();
  const { data } = supabase.storage.from(PRODUCT_COVERS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Generates a time-limited download link. Only call this after a payment is confirmed. */
export async function getSignedDownloadUrl(filePath: string): Promise<string> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(PRODUCT_FILES_BUCKET)
    .createSignedUrl(filePath, DOWNLOAD_URL_TTL_SECONDS);

  if (error) throw error;
  return data.signedUrl;
}

export async function deleteProductFile(path: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(PRODUCT_FILES_BUCKET).remove([path]);
  if (error) throw error;
}

export async function deleteCoverImage(path: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(PRODUCT_COVERS_BUCKET).remove([path]);
  if (error) throw error;
}
