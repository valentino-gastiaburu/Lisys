import Image from "next/image";
import { getStoreSettings } from "@/lib/db/settings";
import { updateStoreSettingsAction, updateHeroAction } from "@/lib/actions/settings";
import { getPublicCoverUrl } from "@/lib/storage/files";

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const settings = await getStoreSettings();
  const heroImageUrl = settings.hero_image_path ? getPublicCoverUrl(settings.hero_image_path) : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Configuración</h1>

      <div className="max-w-lg rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="font-medium">Portada de la home</h2>
        <p className="mt-1 text-sm text-zinc-500">
          El título, la bajada y la imagen de fondo que se ven arriba de todo en el catálogo.
        </p>

        {heroImageUrl && (
          <div className="relative mt-4 aspect-[21/9] w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
            <Image src={heroImageUrl} alt="Portada actual" fill className="object-cover" />
          </div>
        )}

        <form action={updateHeroAction} className="mt-4 flex flex-col gap-3">
          <label className="text-sm font-medium">
            Título
            <input
              type="text"
              name="hero_title"
              required
              defaultValue={settings.hero_title}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="text-sm font-medium">
            Descripción
            <textarea
              name="hero_description"
              rows={2}
              defaultValue={settings.hero_description}
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="text-sm font-medium">
            Imagen de fondo {heroImageUrl ? "(dejar vacío para mantener la actual)" : "(opcional)"}
            <input type="file" name="hero_image" accept="image/*" className="mt-1 w-full text-sm" />
          </label>
          <button
            type="submit"
            className="mt-2 self-start rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400"
          >
            Guardar portada
          </button>
        </form>
      </div>

      <div className="max-w-lg rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
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
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-400"
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
