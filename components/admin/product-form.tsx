import type { Category } from "@/lib/types";
import type { Product } from "@/lib/types";

export function ProductForm({
  action,
  categories,
  product,
}: {
  action: (formData: FormData) => void;
  categories: Category[];
  product?: Product;
}) {
  const defaultPrice = product ? (product.price_cents / 100).toFixed(2) : "";

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
