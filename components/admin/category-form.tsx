import type { Category } from "@/lib/types";

export function CategoryForm({
  action,
  category,
}: {
  action: (formData: FormData) => void;
  category?: Category;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <label className="text-sm font-medium">
        Nombre
        <input
          type="text"
          name="name"
          required
          defaultValue={category?.name}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <label className="text-sm font-medium">
        Descripción
        <textarea
          name="description"
          rows={3}
          defaultValue={category?.description ?? ""}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>

      <button
        type="submit"
        className="mt-2 rounded bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {category ? "Guardar cambios" : "Crear categoría"}
      </button>
    </form>
  );
}
