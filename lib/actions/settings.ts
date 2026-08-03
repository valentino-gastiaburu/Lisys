"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { updateStoreSettings } from "@/lib/db/settings";
import { uploadCoverImage } from "@/lib/storage/files";

const HERO_IMAGE_PATH = "_site/hero";

export async function updateStoreSettingsAction(formData: FormData) {
  await requireAdmin();

  const add = parseFloat(String(formData.get("usd_formula_add") ?? "0"));
  const divide = parseFloat(String(formData.get("usd_formula_divide") ?? "1"));

  if (!Number.isFinite(add) || add < 0) throw new Error("El monto a sumar no es válido");
  if (!Number.isFinite(divide) || divide <= 0) throw new Error("El divisor tiene que ser mayor a 0");

  await updateStoreSettings({ usd_formula_add: add, usd_formula_divide: divide });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/productos");
}

export async function updateCourseMarkupAction(formData: FormData) {
  await requireAdmin();

  const markup = parseFloat(String(formData.get("child_item_markup") ?? "0"));
  if (!Number.isFinite(markup) || markup < 0) throw new Error("El monto no es válido");

  await updateStoreSettings({ child_item_markup_cents: Math.round(markup * 100) });

  revalidatePath("/admin/configuracion");
  revalidatePath("/admin/productos");
}

export async function updateHeroAction(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("hero_title") ?? "").trim();
  const description = String(formData.get("hero_description") ?? "").trim();
  const image = formData.get("hero_image");

  if (!title) throw new Error("El título es obligatorio");

  const update: Parameters<typeof updateStoreSettings>[0] = {
    hero_title: title,
    hero_description: description,
  };

  if (image instanceof File && image.size > 0) {
    await uploadCoverImage(HERO_IMAGE_PATH, image);
    update.hero_image_path = HERO_IMAGE_PATH;
  }

  await updateStoreSettings(update);

  revalidatePath("/admin/configuracion");
  revalidatePath("/");
}
