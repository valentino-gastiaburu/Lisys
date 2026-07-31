import Link from "next/link";
import { getAllProductsForAdmin } from "@/lib/db/products";
import { deleteProductAction } from "@/lib/actions/products";
import { formatPrice } from "@/lib/format";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { StorageUsageCard } from "@/components/admin/storage-usage";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProductsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Nuevo producto
        </Link>
      </div>

      <div className="mt-4 max-w-sm">
        <StorageUsageCard />
      </div>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="py-2 pr-4">Título</th>
            <th className="py-2 pr-4">Categoría</th>
            <th className="py-2 pr-4">Precio</th>
            <th className="py-2 pr-4">Estado</th>
            <th className="py-2 pr-4"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2 pr-4">{product.title}</td>
              <td className="py-2 pr-4 text-zinc-500">{product.category?.name ?? "—"}</td>
              <td className="py-2 pr-4">{formatPrice(product.price_cents, product.currency)}</td>
              <td className="py-2 pr-4">
                <span
                  className={
                    product.status === "published"
                      ? "rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200"
                      : "rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }
                >
                  {product.status === "published" ? "Publicado" : "Borrador"}
                </span>
              </td>
              <td className="py-2 pr-4 text-right">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/productos/${product.id}`} className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                    Editar
                  </Link>
                  <form action={deleteProductAction.bind(null, product.id)}>
                    <ConfirmSubmitButton
                      confirmMessage={`¿Eliminar "${product.title}"? Esta acción no se puede deshacer.`}
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

      {products.length === 0 && (
        <p className="mt-6 text-zinc-500">Todavía no creaste ningún producto.</p>
      )}
    </div>
  );
}
