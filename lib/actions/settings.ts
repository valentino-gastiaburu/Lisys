"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { updateStoreSettings } from "@/lib/db/settings";

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
