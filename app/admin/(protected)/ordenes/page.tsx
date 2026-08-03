import { getOrdersForAdmin } from "@/lib/db/orders";
import { formatPrice } from "@/lib/format";
import { REJECTION_REASONS, PAYMENT_METHOD_LABELS as MP_METHOD_LABELS } from "@/lib/payments/mercadopago";
import { PAYMENT_METHOD_LABELS as PAYPAL_METHOD_LABELS } from "@/lib/payments/paypal";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  paid: "Pagada",
  refunded: "Reembolsada",
  rejected: "Rechazada",
};

const STATUS_COLOR: Record<string, string> = {
  paid: "text-emerald-600 dark:text-emerald-400",
  rejected: "text-red-600 dark:text-red-400",
  pending: "text-zinc-500",
  refunded: "text-zinc-500",
};

const PROVIDER_LABEL: Record<string, string> = {
  mercadopago: "Mercado Pago",
  paypal: "PayPal",
};

function methodLabel(provider: string, method: string | null): string {
  if (!method) return "—";
  const labels = provider === "paypal" ? PAYPAL_METHOD_LABELS : MP_METHOD_LABELS;
  return labels[method] ?? method;
}

function reasonLabel(provider: string, statusDetail: string | null): string | null {
  if (!statusDetail) return null;
  if (provider === "mercadopago") return REJECTION_REASONS[statusDetail] ?? statusDetail;
  return statusDetail;
}

export default async function AdminOrdersPage() {
  const orders = await getOrdersForAdmin();

  return (
    <div>
      <h1 className="text-xl font-semibold">Órdenes</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Incluye ventas confirmadas e intentos de pago rechazados.
      </p>

      <table className="mt-6 w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
          <tr>
            <th className="py-2 pr-4">Fecha</th>
            <th className="py-2 pr-4">Producto</th>
            <th className="py-2 pr-4">Comprador</th>
            <th className="py-2 pr-4">Monto</th>
            <th className="py-2 pr-4">Proveedor</th>
            <th className="py-2 pr-4">Método</th>
            <th className="py-2 pr-4">Estado</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const reason = order.status === "rejected" ? reasonLabel(order.provider, order.status_detail) : null;
            return (
              <tr key={order.id} className="border-b border-zinc-100 dark:border-zinc-900">
                <td className="py-2 pr-4 text-zinc-500">
                  {new Date(order.created_at).toLocaleDateString("es")}
                </td>
                <td className="py-2 pr-4">{order.product?.title ?? "—"}</td>
                <td className="py-2 pr-4">{order.buyer_email || "—"}</td>
                <td className="py-2 pr-4">{formatPrice(order.amount_cents, order.currency)}</td>
                <td className="py-2 pr-4">{PROVIDER_LABEL[order.provider] ?? order.provider}</td>
                <td className="py-2 pr-4">{methodLabel(order.provider, order.payment_method)}</td>
                <td className="py-2 pr-4">
                  <span className={STATUS_COLOR[order.status] ?? ""}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  {reason && <div className="text-xs text-zinc-500">{reason}</div>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {orders.length === 0 && <p className="mt-6 text-zinc-500">Todavía no hay ventas.</p>}
    </div>
  );
}
