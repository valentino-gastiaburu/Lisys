import Link from "next/link";
import { getCategories } from "@/lib/db/categories";
import { deleteCategoryAction } from "@/lib/actions/categories";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await getCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Categorías</h1>
        <Link
          href="/admin/categorias/nuevo"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Nueva categoría
        </Link>
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="py-2 pr-4">Nombre</th>
            <th className="py-2 pr-4">Slug</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {categories.map((category) => (
            <tr key={category.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2 pr-4">{category.name}</td>
              <td className="py-2 pr-4 text-zinc-500">{category.slug}</td>
              <td className="py-2 pr-4 text-right">
                <div className="flex justify-end gap-3">
                  <Link
                    href={`/admin/categorias/${category.id}`}
                    className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    Editar
                  </Link>
                  <form action={deleteCategoryAction.bind(null, category.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`¿Eliminar "${category.name}"? Los productos quedarán sin categoría.`}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </ConfirmSubmitButton>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {categories.length === 0 && (
        <p className="mt-6 text-zinc-500">Todavía no creaste ninguna categoría.</p>
      )}
    </div>
  );
}
