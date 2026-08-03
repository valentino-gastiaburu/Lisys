import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getPublishedProductBySlug, getChildProducts } from "@/lib/db/products";
import { getPaidOrderCountForProduct } from "@/lib/db/orders";
import { getPublicCoverUrl } from "@/lib/storage/files";
import { AddToCartButton } from "@/components/shop/add-to-cart-button";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

function LockIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400">
      <path
        fillRule="evenodd"
        d="M10 1a4 4 0 0 0-4 4v2H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1V5a4 4 0 0 0-4-4Zm2 6V5a2 2 0 1 0-4 0v2h4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400">
      <path
        fillRule="evenodd"
        d="M11.983 1.907a.75.75 0 0 0-1.292-.657L4.204 9.302a.75.75 0 0 0 .557 1.248h4.077l-1.02 6.542a.75.75 0 0 0 1.292.657l6.487-8.052a.75.75 0 0 0-.557-1.248h-4.077l1.02-6.542Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400">
      <path
        fillRule="evenodd"
        d="M2 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-4 3v-3H4a2 2 0 0 1-2-2V5Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function TrustBadge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      {icon}
      {text}
    </div>
  );
}

interface ModuleWithVideos {
  module: Product;
  videos: Product[];
}

async function loadCurriculum(courseId: string): Promise<ModuleWithVideos[]> {
  const modules = await getChildProducts(courseId);
  return Promise.all(
    modules.map(async (courseModule) => ({
      module: courseModule,
      videos: await getChildProducts(courseModule.id),
    }))
  );
}

function findFreePreview(
  curriculum: ModuleWithVideos[]
): { video: Product; moduleTitle: string } | null {
  for (const { module: courseModule, videos } of curriculum) {
    const preview = videos.find((v) => v.is_preview);
    if (preview) return { video: preview, moduleTitle: courseModule.title };
  }
  return null;
}

function CourseCurriculum({
  course,
  curriculum,
}: {
  course: Product;
  curriculum: ModuleWithVideos[];
}) {
  if (curriculum.length === 0) return null;

  const skipModuleHeading = curriculum.length === 1;

  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Contenido</h2>
      <div className="mt-3 flex flex-col gap-4">
        {curriculum.map(({ module: courseModule, videos }) => {
          const videoList = (
            <div className={skipModuleHeading ? "flex flex-col gap-3" : "mt-3 ml-4 flex flex-col gap-3"}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Video
                      </span>
                      {video.is_preview && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                          Gratis
                        </span>
                      )}
                      <span className="text-sm font-medium">{video.title}</span>
                    </div>
                    {video.is_preview ? (
                      <a
                        href={video.external_link ?? "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-sky-600 underline dark:text-sky-400"
                      >
                        Ver gratis
                      </a>
                    ) : (
                      course.allow_video_purchase && (
                        <span className="text-xs text-zinc-500">
                          {formatPrice(video.price_cents, video.currency)}
                        </span>
                      )
                    )}
                  </div>
                  {!video.is_preview && course.allow_video_purchase && (
                    <div className="mt-1">
                      <AddToCartButton productId={video.id} variant="compact" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          );

          if (skipModuleHeading) {
            return <div key={courseModule.id}>{videoList}</div>;
          }

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
                  <h3 className="font-semibold">{courseModule.title}</h3>
                </div>
                {course.allow_module_purchase && (
                  <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {formatPrice(courseModule.price_cents, courseModule.currency)}
                  </span>
                )}
              </div>
              {course.allow_module_purchase && (
                <div className="mt-2">
                  <AddToCartButton productId={courseModule.id} />
                </div>
              )}

              {videoList}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const buyerCount = await getPaidOrderCountForProduct(product.id);

  const curriculum = product.product_type === "course" ? await loadCurriculum(product.id) : [];
  const freePreview = findFreePreview(curriculum);

  // Comparing against buying every module separately, since that's the
  // level a buyer actually chooses between — not a sum all the way down to
  // individual videos, which isn't a real alternative to "buy the course".
  const modulesTotalCents = curriculum.reduce((sum, { module: m }) => sum + m.price_cents, 0);
  const savingsCents =
    product.product_type === "course" && product.allow_module_purchase && curriculum.length > 1
      ? modulesTotalCents - product.price_cents
      : 0;

  const coverUrl = product.cover_image_path
    ? getPublicCoverUrl(product.cover_image_path)
    : null;

  const hasCompareAt =
    product.compare_at_price_cents != null && product.compare_at_price_cents > product.price_cents;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link
        href="/"
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        ← {product.category?.name ?? "Catálogo"}
      </Link>

      <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
        {product.title}
      </h1>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="order-2 lg:order-1 lg:col-span-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
            {coverUrl ? (
              <Image src={coverUrl} alt={product.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400">
                Sin portada
              </div>
            )}
          </div>

          {freePreview && (
            <a
              href={freePreview.video.external_link ?? "#"}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 transition hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/40 dark:hover:bg-sky-950/70"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white">
                ▶
              </span>
              <span>
                <span className="block text-sm font-semibold text-sky-900 dark:text-sky-200">
                  Mira gratis: {freePreview.video.title}
                </span>
                <span className="block text-xs text-sky-700 dark:text-sky-400">
                  Sin pagar, sin registrarte — es una muestra del curso.
                </span>
              </span>
            </a>
          )}

          {product.description && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                Descripción
              </h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-zinc-700 dark:text-zinc-300">
                {product.description}
              </p>
            </div>
          )}

          {product.product_type === "course" && (
            <CourseCurriculum course={product} curriculum={curriculum} />
          )}
        </div>

        <div className="order-1 lg:order-2 lg:col-span-2">
          <div className="lg:sticky lg:top-24 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            {product.product_type === "course" && product.allow_module_purchase && (
              <span className="mb-2 inline-flex items-center gap-1 rounded-full border border-zinc-300 px-2.5 py-1 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                Mejor precio — todo el curso
              </span>
            )}

            <div className="flex items-baseline gap-2">
              {hasCompareAt && (
                <span className="text-lg text-zinc-400 line-through dark:text-zinc-600">
                  {formatPrice(product.compare_at_price_cents!, product.currency)}
                </span>
              )}
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatPrice(product.price_cents, product.currency)}
              </p>
            </div>

            {savingsCents > 0 && (
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Ahorras {formatPrice(savingsCents, product.currency)} comprando el curso completo
              </p>
            )}

            {buyerCount > 0 && (
              <p className="mt-1 text-xs text-zinc-500">
                {buyerCount === 1 ? "1 persona ya lo compró" : `${buyerCount} personas ya lo compraron`}
              </p>
            )}

            <div className="mt-6">
              <AddToCartButton
                productId={product.id}
                priceCents={product.price_cents}
                currency={product.currency}
                variant="primary"
              />
              <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                <TrustBadge icon={<LockIcon />} text="Pago seguro con Mercado Pago o PayPal" />
                <TrustBadge icon={<BoltIcon />} text="Entrega inmediata por email" />
                <TrustBadge icon={<ChatIcon />} text="Soporte si algo no llega" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
