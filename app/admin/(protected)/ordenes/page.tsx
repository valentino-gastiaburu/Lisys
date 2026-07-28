import { getOrdersForAdmin } from "@/lib/db/orders";
import { formatPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  refunded: "Reembolsada",
};

export default async function AdminOrdersPage() {
  const orders = await getOrdersForAdmin();

  return (
    <div>
      <h1 className="text-xl font-semibold">Órdenes</h1>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="py-2 pr-4">Fecha</th>
            <th className="py-2 pr-4">Producto</th>
            <th className="py-2 pr-4">Comprador</th>
            <th className="py-2 pr-4">Monto</th>
            <th className="py-2 pr-4">Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-900">
              <td className="py-2 pr-4 text-zinc-500">
                {new Date(order.created_at).toLocaleDateString("es")}
              </td>
              <td className="py-2 pr-4">{order.product?.title ?? "—"}</td>
              <td className="py-2 pr-4">{order.buyer_email}</td>
              <td className="py-2 pr-4">{formatPrice(order.amount_cents, order.currency)}</td>
              <td className="py-2 pr-4">{STATUS_LABEL[order.status] ?? order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {orders.length === 0 && <p className="mt-6 text-zinc-500">Todavía no hay ventas.</p>}
    </div>
  );
}
