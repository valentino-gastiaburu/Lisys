export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(text: string): string {
  return `${slugify(text)}-${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Makes an uploaded file's original name safe to use as a Supabase Storage
 * key segment. Storage keys are `/`-delimited like a filesystem path, so an
 * unsanitized name (e.g. containing `../`) could otherwise let an upload
 * write outside the product's own `${slug}/` prefix.
 */
export function sanitizeFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() || "archivo";
  const cleaned = base.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "_");
  return cleaned || "archivo";
}
