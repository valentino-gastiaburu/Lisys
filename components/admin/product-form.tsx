import type { Category, Product } from "@/lib/types";
import type { StoreSettings } from "@/lib/db/settings";
import { computeUsdCents } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";

export function ProductForm({
  action,
  categories,
  product,
  settings,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  product?: Product;
  settings: StoreSettings;
}) {
  const defaultPrice = product ? (product.price_cents / 100).toFixed(2) : "";
  const defaultUsdManual = product?.price_usd_manual_cents
    ? (product.price_usd_manual_cents / 100).toFixed(2)
    : "";
  const calculatedPreview = product
    ? formatPrice(computeUsdCents({ ...product, price_usd_mode: "calculated" }, settings), "USD")
    : null;

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <label className="text-sm font-medium">
        Título
        <input
          type="text"
          name="title"
          required
          defaultValue={product?.title}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="text-sm font-medium">
        Descripción
        <textarea
          name="description"
          rows={4}
          defaultValue={product?.description ?? ""}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <div className="flex gap-4">
        <label className="flex-1 text-sm font-medium">
          Precio
          <input
            type="number"
            name="price"
            step="0.01"
            min="0"
            required
            defaultValue={defaultPrice}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="w-28 text-sm font-medium">
          Moneda
          <input
            type="text"
            name="currency"
            defaultValue={product?.currency ?? "PEN"}
            className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm uppercase dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      </div>

      <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <span className="text-sm font-medium">Precio en USD (para PayPal)</span>
        <div className="mt-2 flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="price_usd_mode"
              value="calculated"
              defaultChecked={(product?.price_usd_mode ?? "calculated") === "calculated"}
            />
            Calculado automáticamente con la fórmula de{" "}
            <a href="/admin/configuracion" className="underline">
              Configuración
            </a>
            {calculatedPreview && <span className="text-zinc-500">(hoy: {calculatedPreview})</span>}
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="price_usd_mode"
              value="manual"
              defaultChecked={product?.price_usd_mode === "manual"}
            />
            Precio manual:
            <input
              type="number"
              name="price_usd_manual"
              step="0.01"
              min="0"
              defaultValue={defaultUsdManual}
              placeholder="9.99"
              className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
        </div>
      </div>

      <label className="text-sm font-medium">
        Categoría
        <select
          name="category_id"
          defaultValue={product?.category_id ?? ""}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Sin categoría</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="text-sm font-medium">
        Estado
        <select
          name="status"
          defaultValue={product?.status ?? "draft"}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
        </select>
      </label>

      <label className="text-sm font-medium">
        Archivo digital {product ? "(dejar vacío para mantener el actual)" : ""}
        <input type="file" name="file" required={!product} className="mt-1 w-full text-sm" />
      </label>

      <label className="text-sm font-medium">
        Portada (imagen, opcional)
        <input type="file" name="cover_image" accept="image/*" className="mt-1 w-full text-sm" />
      </label>

      <button
        type="submit"
        className="mt-2 rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {product ? "Guardar cambios" : "Crear producto"}
      </button>
    </form>
  );
}
