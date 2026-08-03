import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductByIdForAdmin, getChildProducts } from "@/lib/db/products";
import { getStoreSettings } from "@/lib/db/settings";
import { computeChildPriceCents } from "@/lib/pricing";
import { formatPrice } from "@/lib/format";
import { updateProductStatusAction } from "@/lib/actions/products";
import {
  createModuleAction,
  updateModuleAction,
  createVideoAction,
  updateVideoAction,
} from "@/lib/actions/curriculum";
import { StatusSelect } from "@/components/admin/status-select";
import { DirtyForm } from "@/components/admin/dirty-form";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

function PriceFields({ mode, manualCents, suggestedCents, currency }: {
  mode: "calculated" | "manual";
  manualCents: number | null;
  suggestedCents: number;
  currency: string;
}) {
  return (
    <div className="flex flex-col gap-1 text-xs">
      <label className="flex items-center gap-1.5">
        <input type="radio" name="price_mode" value="calculated" defaultChecked={mode === "calculated"} />
        Calculado (sugerido: {formatPrice(suggestedCents, currency)})
      </label>
      <label className="flex items-center gap-1.5">
        <input type="radio" name="price_mode" value="manual" defaultChecked={mode === "manual"} />
        Manual:
        <input
          type="number"
          name="price_manual"
          step="0.01"
          min="0"
          defaultValue={manualCents != null ? (manualCents / 100).toFixed(2) : ""}
          className="w-20 rounded border border-zinc-300 px-1.5 py-0.5 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
    </div>
  );
}

export default async function CourseCurriculumPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id: courseId } = await params;
  const { saved } = await searchParams;
  const course = await getProductByIdForAdmin(courseId);
  if (!course || course.product_type !== "course") notFound();

  const settings = await getStoreSettings();
  const modules = await getChildProducts(courseId);
  const videosByModule = new Map<string, Product[]>();
  for (const courseModule of modules) {
    videosByModule.set(courseModule.id, await getChildProducts(courseModule.id));
  }

  const suggestedModulePrice = computeChildPriceCents(
    course.price_cents,
    modules.length + 1,
    settings.child_item_markup_cents
  );

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <Link
          href={`/admin/productos/${courseId}`}
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        >
          ← {course.title}
        </Link>
        <h1 className="mt-1 text-xl font-semibold">Módulos y videos</h1>
      </div>

      {modules.map((courseModule) => {
        const videos = videosByModule.get(courseModule.id) ?? [];
        const suggestedVideoPrice = computeChildPriceCents(
          courseModule.price_cents,
          videos.length + 1,
          settings.child_item_markup_cents
        );

        return (
          <div
            key={courseModule.id}
            className="rounded-xl border-2 border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Módulo
                </span>
                <h2 className="font-medium">{courseModule.title}</h2>
              </div>
              <StatusSelect id={courseModule.id} status={courseModule.status} action={updateProductStatusAction} />
            </div>

            <DirtyForm
              action={updateModuleAction.bind(null, courseId, courseModule.id)}
              className="mt-3 flex flex-wrap items-end gap-3"
              submitLabel="Guardar módulo"
              saved={saved === courseModule.id}
            >
              <label className="text-xs font-medium">
                Título
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={courseModule.title}
                  className="mt-1 block rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="text-xs font-medium">
                Orden
                <input
                  type="number"
                  name="position"
                  defaultValue={courseModule.position}
                  className="mt-1 block w-16 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="text-xs font-medium">
                Link del módulo (opcional)
                <input
                  type="url"
                  name="module_link"
                  defaultValue={courseModule.delivery_type === "link" ? courseModule.external_link ?? "" : ""}
                  placeholder="dejar vacío para entregar los videos por separado"
                  className="mt-1 block w-56 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <PriceFields
                mode={courseModule.price_mode}
                manualCents={courseModule.price_mode === "manual" ? courseModule.price_cents : null}
                suggestedCents={computeChildPriceCents(
                  course.price_cents,
                  Math.max(modules.length, 1),
                  settings.child_item_markup_cents
                )}
                currency={courseModule.currency}
              />
            </DirtyForm>

            <div className="mt-4 flex flex-col gap-3">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="ml-4 rounded-lg border border-zinc-300 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        Video
                      </span>
                      {video.is_preview && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          Gratis
                        </span>
                      )}
                      <span className="text-sm font-medium">{video.title}</span>
                    </div>
                    <StatusSelect id={video.id} status={video.status} action={updateProductStatusAction} />
                  </div>
                  <DirtyForm
                    action={updateVideoAction.bind(null, courseId, courseModule.id, video.id)}
                    className="mt-2 flex flex-wrap items-end gap-3"
                    submitLabel="Guardar video"
                    saved={saved === video.id}
                  >
                    <label className="text-xs font-medium">
                      Título
                      <input
                        type="text"
                        name="title"
                        required
                        defaultValue={video.title}
                        className="mt-1 block rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Link del video
                      <input
                        type="url"
                        name="video_url"
                        required
                        defaultValue={video.external_link ?? ""}
                        className="mt-1 block w-64 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </label>
                    <label className="text-xs font-medium">
                      Orden
                      <input
                        type="number"
                        name="position"
                        defaultValue={video.position}
                        className="mt-1 block w-16 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                      />
                    </label>
                    <PriceFields
                      mode={video.price_mode}
                      manualCents={video.price_mode === "manual" ? video.price_cents : null}
                      suggestedCents={computeChildPriceCents(
                        courseModule.price_cents,
                        Math.max(videos.length, 1),
                        settings.child_item_markup_cents
                      )}
                      currency={video.currency}
                    />
                    <label className="flex items-center gap-1.5 text-xs font-medium">
                      <input type="checkbox" name="is_preview" defaultChecked={video.is_preview} />
                      Vista previa gratuita
                    </label>
                  </DirtyForm>
                </div>
              ))}

              <form
                action={createVideoAction.bind(null, courseId, courseModule.id)}
                className="ml-4 flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-zinc-300 p-2.5 dark:border-zinc-700"
              >
                <label className="text-xs font-medium">
                  Nuevo video — título
                  <input
                    type="text"
                    name="title"
                    required
                    className="mt-1 block rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <label className="text-xs font-medium">
                  Link
                  <input
                    type="url"
                    name="video_url"
                    required
                    placeholder="https://..."
                    className="mt-1 block w-64 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                  />
                </label>
                <PriceFields
                  mode="calculated"
                  manualCents={null}
                  suggestedCents={suggestedVideoPrice}
                  currency={courseModule.currency}
                />
                <label className="flex items-center gap-1.5 text-xs font-medium">
                  <input type="checkbox" name="is_preview" />
                  Vista previa gratuita
                </label>
                <button
                  type="submit"
                  className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-zinc-900 transition hover:bg-emerald-400"
                >
                  Agregar video
                </button>
              </form>
            </div>
          </div>
        );
      })}

      <form
        action={createModuleAction.bind(null, courseId)}
        className="flex flex-wrap items-end gap-3 rounded-lg border border-dashed border-zinc-300 p-4 dark:border-zinc-700"
      >
        <label className="text-xs font-medium">
          Nuevo módulo — título
          <input
            type="text"
            name="title"
            required
            className="mt-1 block rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="text-xs font-medium">
          Link del módulo (opcional)
          <input
            type="url"
            name="module_link"
            placeholder="dejar vacío para entregar los videos por separado"
            className="mt-1 block w-56 rounded border border-zinc-300 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <PriceFields mode="calculated" manualCents={null} suggestedCents={suggestedModulePrice} currency={course.currency} />
        <button
          type="submit"
          className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-emerald-400"
        >
          Agregar módulo
        </button>
      </form>

      {modules.length === 0 && (
        <p className="text-sm text-zinc-500">
          Todavía no agregaste ningún módulo. Si el curso tiene un único módulo, en la tienda no
          se muestra como "Módulo 1" — los videos aparecen listados directamente.
        </p>
      )}
    </div>
  );
}
