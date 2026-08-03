"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import {
  createProduct,
  updateProduct,
  getProductByIdForAdmin,
} from "@/lib/db/products";
import {
  uploadProductFile,
  uploadCoverImage,
  deleteProductFile,
  deleteCoverImage,
} from "@/lib/storage/files";
import { uniqueSlug, sanitizeFileName } from "@/lib/slugify";
import type { ProductStatus, PriceUsdMode, ProductType, DeliveryType } from "@/lib/types";

const PRODUCT_STATUSES: ProductStatus[] = ["draft", "published", "inactive"];

function readCommonFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const priceInput = String(formData.get("price") ?? "0");
  const currency = String(formData.get("currency") ?? "PEN").toUpperCase();
  const categoryIdRaw = String(formData.get("category_id") ?? "");
  const statusRaw = formData.get("status");
  const status: ProductStatus = PRODUCT_STATUSES.includes(statusRaw as ProductStatus)
    ? (statusRaw as ProductStatus)
    : "draft";
  const priceUsdMode: PriceUsdMode =
    formData.get("price_usd_mode") === "manual" ? "manual" : "calculated";
  const priceUsdManualInput = String(formData.get("price_usd_manual") ?? "").trim();
  const productType: ProductType = formData.get("product_type") === "course" ? "course" : "simple";
  const deliveryType: DeliveryType = formData.get("delivery_type") === "link" ? "link" : "file";
  const externalLinkInput = String(formData.get("external_link") ?? "").trim();
  const allowModulePurchase = formData.get("allow_module_purchase") === "on";
  const allowVideoPurchase = formData.get("allow_video_purchase") === "on";
  const compareAtPriceInput = String(formData.get("compare_at_price") ?? "").trim();

  if (!title) throw new Error("El título es obligatorio");
  if (priceUsdMode === "manual" && !priceUsdManualInput) {
    throw new Error("Ingresá el precio manual en USD, o elegí precio calculado");
  }
  if (productType === "simple" && deliveryType === "link" && !externalLinkInput) {
    throw new Error("Ingresá el link del producto, o elegí entrega por archivo");
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
    product_type: productType,
    delivery_type:
      productType === "course"
        ? (externalLinkInput ? "link" : "file") as DeliveryType
        : deliveryType,
    external_link:
      productType === "course"
        ? externalLinkInput || null
        : deliveryType === "link"
          ? externalLinkInput
          : null,
    allow_module_purchase: productType === "course" ? allowModulePurchase : false,
    allow_video_purchase: productType === "course" ? allowVideoPurchase : false,
    compare_at_price_cents: compareAtPriceInput
      ? Math.round(parseFloat(compareAtPriceInput) * 100)
      : null,
  };
}

export async function createProductAction(formData: FormData) {
  await requireAdmin();

  const common = readCommonFields(formData);
  const slug = uniqueSlug(common.title);
  const coverFile = formData.get("cover_image");

  let filePath: string | null = null;
  if (common.product_type === "simple" && common.delivery_type === "file") {
    const productFile = formData.get("file");
    if (!(productFile instanceof File) || productFile.size === 0) {
      throw new Error("El archivo digital es obligatorio");
    }
    filePath = `${slug}/${sanitizeFileName(productFile.name)}`;
    await uploadProductFile(filePath, productFile);
  }

  let coverImagePath: string | null = null;
  if (coverFile instanceof File && coverFile.size > 0) {
    coverImagePath = `${slug}/${sanitizeFileName(coverFile.name)}`;
    await uploadCoverImage(coverImagePath, coverFile);
  }

  const created = await createProduct({
    ...common,
    slug,
    file_path: filePath,
    cover_image_path: coverImagePath,
  });

  revalidatePath("/admin/productos");
  revalidatePath("/");

  if (created.product_type === "course") {
    redirect(`/admin/productos/${created.id}/curriculum`);
  }
  redirect("/admin/productos");
}

export async function updateProductAction(id: string, formData: FormData) {
  await requireAdmin();

  const existing = await getProductByIdForAdmin(id);
  if (!existing) throw new Error("Producto no encontrado");

  const common = readCommonFields(formData);
  const coverFile = formData.get("cover_image");

  let filePath = existing.file_path;
  if (common.product_type === "simple" && common.delivery_type === "file") {
    const productFile = formData.get("file");
    if (productFile instanceof File && productFile.size > 0) {
      filePath = `${existing.slug}/${sanitizeFileName(productFile.name)}`;
      await uploadProductFile(filePath, productFile);
      if (existing.file_path && existing.file_path !== filePath) {
        await deleteProductFile(existing.file_path).catch(() => {});
      }
    }
    // Switching an existing item to file delivery (e.g. from a course, or
    // from link delivery) without also uploading a file would otherwise
    // save silently — leaving a product buyers can pay for with nothing to
    // deliver.
    if (!filePath) {
      throw new Error("Subí un archivo, o elegí entrega por link");
    }
  } else if (existing.file_path) {
    // Switched away from file delivery (or to a course) — the old upload is unused.
    await deleteProductFile(existing.file_path).catch(() => {});
    filePath = null;
  }

  let coverImagePath = existing.cover_image_path;
  if (coverFile instanceof File && coverFile.size > 0) {
    coverImagePath = `${existing.slug}/${sanitizeFileName(coverFile.name)}`;
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

export async function updateProductStatusAction(id: string, formData: FormData) {
  await requireAdmin();

  const statusRaw = formData.get("status");
  if (!PRODUCT_STATUSES.includes(statusRaw as ProductStatus)) {
    throw new Error("Estado inválido");
  }

  await updateProduct(id, { status: statusRaw as ProductStatus });

  revalidatePath("/admin/productos");
  revalidatePath("/");
}
