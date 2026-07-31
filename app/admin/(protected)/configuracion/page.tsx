import { getStoreSettings } from "@/lib/db/settings";
import { updateStoreSettingsAction } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const settings = await getStoreSettings();

  return (
    <div>
      <h1 className="text-xl font-semibold">Configuración</h1>

      <div className="mt-6 max-w-lg rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="font-medium">Precio en USD para PayPal</h2>
        <p className="mt-1 text-sm text-zinc-500">
          PayPal no opera en soles, así que cada producto necesita un precio en dólares. Por
          defecto se calcula con esta fórmula a partir del precio en soles:
        </p>
        <p className="mt-2 rounded bg-zinc-100 px-3 py-2 font-mono text-sm dark:bg-zinc-900">
          USD = redondear_arriba( (soles + A) / B )
        </p>

        <form action={updateStoreSettingsAction} className="mt-4 flex items-end gap-4">
          <label className="text-sm font-medium">
            A (sumar)
            <input
              type="number"
              name="usd_formula_add"
              step="0.01"
              min="0"
              required
              defaultValue={settings.usd_formula_add}
              className="mt-1 w-24 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="text-sm font-medium">
            B (dividir)
            <input
              type="number"
              name="usd_formula_divide"
              step="0.01"
              min="0.01"
              required
              defaultValue={settings.usd_formula_divide}
              className="mt-1 w-24 rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Guardar
          </button>
        </form>

        <p className="mt-4 text-xs text-zinc-500">
          Cualquier producto individual puede tener su propio precio manual en USD que ignora
          esta fórmula — se configura al editar el producto.
        </p>
      </div>
    </div>
  );
}
