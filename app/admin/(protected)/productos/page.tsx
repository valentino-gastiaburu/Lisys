import Link from "next/link";
import { getAllProductsForAdmin } from "@/lib/db/products";
import { updateProductStatusAction } from "@/lib/actions/products";
import { formatPrice } from "@/lib/format";
import { StorageUsageCard } from "@/components/admin/storage-usage";
import { StatusSelect } from "@/components/admin/status-select";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const products = await getAllProductsForAdmin();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-400"
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
                <StatusSelect id={product.id} status={product.status} action={updateProductStatusAction} />
              </td>
              <td className="py-2 pr-4 text-right">
                <Link href={`/admin/productos/${product.id}`} className="text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100">
                  Editar
                </Link>
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
