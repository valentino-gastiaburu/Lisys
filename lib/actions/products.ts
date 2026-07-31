"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByIdForAdmin,
} from "@/lib/db/products";
import {
  uploadProductFile,
  uploadCoverImage,
  deleteProductFile,
  deleteCoverImage,
} from "@/lib/storage/files";
import { uniqueSlug } from "@/lib/slugify";
import type { ProductStatus, PriceUsdMode } from "@/lib/types";

function readCommonFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceInput = String(formData.get("price") ?? "0");
  const currency = String(formData.get("currency") ?? "PEN").toUpperCase();
  const categoryIdRaw = String(formData.get("category_id") ?? "");
  const status: ProductStatus =
    formData.get("status") === "published" ? "published" : "draft";
  const priceUsdMode: PriceUsdMode =
    formData.get("price_usd_mode") === "manual" ? "manual" : "calculated";
  const priceUsdManualInput = String(formData.get("price_usd_manual") ?? "").trim();

  if (!title) throw new Error("El título es obligatorio");
  if (priceUsdMode === "manual" && !priceUsdManualInput) {
    throw new Error("Ingresá el precio manual en USD, o elegí precio calculado");
  }

  return {
    title,
    description: description || null,
    price_cents: Math.round(parseFloat(priceInput || "0") * 100),
    currency,
    category_id: categoryIdRaw || null,
    status,
    price_usd_mode: priceUsdMode,
    price_usd_manual_cents: priceUsdManualInput
      ? Math.round(parseFloat(priceUsdManualInput) * 100)
      : null,
  };
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const common = readCommonFields(formData);
  const productFile = formData.get("file");
  const coverFile = formData.get("cover_image");

  if (!(productFile instanceof File) || productFile.size === 0) {
    throw new Error("El archivo digital es obligatorio");
  }

  const slug = uniqueSlug(common.title);
  const filePath = `${slug}/${productFile.name}`;
  await uploadProductFile(filePath, productFile);

  let coverImagePath: string | null = null;
  if (coverFile instanceof File && coverFile.size > 0) {
    coverImagePath = `${slug}/${coverFile.name}`;
    await uploadCoverImage(coverImagePath, coverFile);
  }

  await createProduct({
    ...common,
    slug,
    file_path: filePath,
    cover_image_path: coverImagePath,
  });

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin();

  const existing = await getProductByIdForAdmin(id);
  if (!existing) throw new Error("Producto no encontrado");

  const common = readCommonFields(formData);
  const productFile = formData.get("file");
  const coverFile = formData.get("cover_image");

  let filePath = existing.file_path;
  if (productFile instanceof File && productFile.size > 0) {
    filePath = `${existing.slug}/${productFile.name}`;
    await uploadProductFile(filePath, productFile);
    if (existing.file_path && existing.file_path !== filePath) {
      await deleteProductFile(existing.file_path).catch(() => {});
    }
  }

  let coverImagePath = existing.cover_image_path;
  if (coverFile instanceof File && coverFile.size > 0) {
    coverImagePath = `${existing.slug}/${coverFile.name}`;
    await uploadCoverImage(coverImagePath, coverFile);
    if (existing.cover_image_path && existing.cover_image_path !== coverImagePath) {
      await deleteCoverImage(existing.cover_image_path).catch(() => {});
    }
  }

  await updateProduct(id, {
    ...common,
    file_path: filePath,
    cover_image_path: coverImagePath,
  });

  revalidatePath("/admin/productos");
  revalidatePath("/");
  redirect("/admin/productos");
}

export async function deleteProductAction(id: string) {
  await requireAdmin();

  const existing = await getProductByIdForAdmin(id);
  if (!existing) return;

  await deleteProduct(id);
  if (existing.file_path) {
    await deleteProductFile(existing.file_path).catch(() => {});
  }
  if (existing.cover_image_path) {
    await deleteCoverImage(existing.cover_image_path).catch(() => {});
  }

  revalidatePath("/admin/productos");
  revalidatePath("/");
}
