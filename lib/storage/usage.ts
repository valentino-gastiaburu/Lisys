import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKETS = ["product-files", "product-covers"] as const;

// Supabase free tier limit as of this writing — see README for where this
// is documented. Update if the plan changes.
export const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;

async function listBucketBytes(bucket: string): Promise<number> {
  const supabase = createAdminClient();
  let total = 0;

  async function walk(prefix: string) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
    if (error) throw error;

    for (const item of data) {
      if (item.id === null) {
        // Storage has no real folders — this is a pseudo-folder, descend into it.
        await walk(prefix ? `${prefix}/${item.name}` : item.name);
      } else {
        total += item.metadata?.size ?? 0;
      }
    }
  }

  await walk("");
  return total;
}

export interface StorageUsage {
  totalBytes: number;
  limitBytes: number;
  percentUsed: number;
}

export async function getStorageUsage(): Promise<StorageUsage> {
  const sizes = await Promise.all(BUCKETS.map(listBucketBytes));
  const totalBytes = sizes.reduce((a, b) => a + b, 0);

  return {
    totalBytes,
    limitBytes: STORAGE_LIMIT_BYTES,
    percentUsed: (totalBytes / STORAGE_LIMIT_BYTES) * 100,
  };
}

export function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}
