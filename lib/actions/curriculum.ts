"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { createProduct, updateProduct, getProductByIdForAdmin, getChildProducts } from "@/lib/db/products";
import { getStoreSettings } from "@/lib/db/settings";
import { computeChildPriceCents } from "@/lib/pricing";
import { uniqueSlug } from "@/lib/slugify";
import type { PriceMode } from "@/lib/types";

function readPriceFields(formData: FormData): { price_mode: PriceMode; manualCents: number | null } {
  const priceMode: PriceMode = formData.get("price_mode") === "manual" ? "manual" : "calculated";
  const manualInput = String(formData.get("price_manual") ?? "").trim();
  return {
    price_mode: priceMode,
    manualCents: manualInput ? Math.round(parseFloat(manualInput) * 100) : null,
  };
}

/**
 * These are plain HTML forms (no client JS), so redirecting back with the
 * saved item's id in the URL is the only way to show a "this one just got
 * saved" confirmation — without it, a save and a no-op look identical.
 */
function finishAndRedirect(courseId: string, courseSlug: string | undefined, savedId: string): never {
  revalidatePath(`/admin/productos/${courseId}/curriculum`);
  revalidatePath("/");
  if (courseSlug) revalidatePath(`/producto/${courseSlug}`);
  redirect(`/admin/productos/${courseId}/curriculum?saved=${savedId}`);
}

export async function createModuleAction(courseId: string, formData: FormData) {
  await requireAdmin();

  const course = await getProductByIdForAdmin(courseId);
  if (!course) throw new Error("Curso no encontrado");

  const title = String(formData.get("title") ?? "").trim();
  const moduleLink = String(formData.get("module_link") ?? "").trim();
  if (!title) throw new Error("El título es obligatorio");

  const { price_mode, manualCents } = readPriceFields(formData);
  const settings = await getStoreSettings();
  const siblings = await getChildProducts(courseId);

  const price_cents =
    price_mode === "manual" && manualCents != null
      ? manualCents
      : computeChildPriceCents(course.price_cents, siblings.length + 1, settings.child_item_markup_cents);

  const created = await createProduct({
    title,
    slug: uniqueSlug(title),
    category_id: null,
    price_cents,
    currency: course.currency,
    status: "published",
    parent_product_id: courseId,
    product_type: "module",
    position: siblings.length,
    price_mode,
    delivery_type: moduleLink ? "link" : "file",
    external_link: moduleLink || null,
  });

  finishAndRedirect(courseId, course.slug, created.id);
}

export async function updateModuleAction(courseId: string, moduleId: string, formData: FormData) {
  await requireAdmin();

  const course = await getProductByIdForAdmin(courseId);
  const courseModule = await getProductByIdForAdmin(moduleId);
  if (!course || !courseModule) throw new Error("No encontrado");

  const title = String(formData.get("title") ?? "").trim();
  const positionInput = String(formData.get("position") ?? "0");
  const moduleLink = String(formData.get("module_link") ?? "").trim();
  if (!title) throw new Error("El título es obligatorio");

  const { price_mode, manualCents } = readPriceFields(formData);
  const settings = await getStoreSettings();
  const siblings = await getChildProducts(courseId);

  const price_cents =
    price_mode === "manual" && manualCents != null
      ? manualCents
      : computeChildPriceCents(course.price_cents, Math.max(siblings.length, 1), settings.child_item_markup_cents);

  await updateProduct(moduleId, {
    title,
    slug: courseModule.slug,
    category_id: null,
    price_cents,
    currency: course.currency,
    status: courseModule.status,
    position: Math.round(parseFloat(positionInput || "0")),
    price_mode,
    delivery_type: moduleLink ? "link" : "file",
    external_link: moduleLink || null,
  });

  finishAndRedirect(courseId, course.slug, moduleId);
}

export async function createVideoAction(courseId: string, moduleId: string, formData: FormData) {
  await requireAdmin();

  const course = await getProductByIdForAdmin(courseId);
  const courseModule = await getProductByIdForAdmin(moduleId);
  if (!course || !courseModule) throw new Error("No encontrado");

  const title = String(formData.get("title") ?? "").trim();
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const isPreview = formData.get("is_preview") === "on";
  if (!title) throw new Error("El título es obligatorio");
  if (!videoUrl) throw new Error("El link del video es obligatorio");

  const { price_mode, manualCents } = readPriceFields(formData);
  const settings = await getStoreSettings();
  const siblings = await getChildProducts(moduleId);

  const price_cents =
    price_mode === "manual" && manualCents != null
      ? manualCents
      : computeChildPriceCents(courseModule.price_cents, siblings.length + 1, settings.child_item_markup_cents);

  const created = await createProduct({
    title,
    slug: uniqueSlug(title),
    category_id: null,
    price_cents,
    currency: course.currency,
    status: "published",
    parent_product_id: moduleId,
    product_type: "video",
    position: siblings.length,
    price_mode,
    delivery_type: "link",
    external_link: videoUrl,
    is_preview: isPreview,
  });

  finishAndRedirect(courseId, course.slug, created.id);
}

export async function updateVideoAction(courseId: string, moduleId: string, videoId: string, formData: FormData) {
  await requireAdmin();

  const course = await getProductByIdForAdmin(courseId);
  const courseModule = await getProductByIdForAdmin(moduleId);
  const video = await getProductByIdForAdmin(videoId);
  if (!course || !courseModule || !video) throw new Error("No encontrado");

  const title = String(formData.get("title") ?? "").trim();
  const videoUrl = String(formData.get("video_url") ?? "").trim();
  const positionInput = String(formData.get("position") ?? "0");
  const isPreview = formData.get("is_preview") === "on";
  if (!title) throw new Error("El título es obligatorio");
  if (!videoUrl) throw new Error("El link del video es obligatorio");

  const { price_mode, manualCents } = readPriceFields(formData);
  const settings = await getStoreSettings();
  const siblings = await getChildProducts(moduleId);

  const price_cents =
    price_mode === "manual" && manualCents != null
      ? manualCents
      : computeChildPriceCents(courseModule.price_cents, Math.max(siblings.length, 1), settings.child_item_markup_cents);

  await updateProduct(videoId, {
    title,
    slug: video.slug,
    category_id: null,
    price_cents,
    currency: course.currency,
    status: video.status,
    position: Math.round(parseFloat(positionInput || "0")),
    price_mode,
    delivery_type: "link",
    external_link: videoUrl,
    is_preview: isPreview,
  });

  finishAndRedirect(courseId, course.slug, videoId);
}
