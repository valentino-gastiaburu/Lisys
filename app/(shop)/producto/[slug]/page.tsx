import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getPublishedProductBySlug } from "@/lib/db/products";
import { getStoreSettings } from "@/lib/db/settings";
import { computeUsdCents } from "@/lib/pricing";
import { getPublicCoverUrl } from "@/lib/storage/files";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const settings = await getStoreSettings();
  const usdCents = computeUsdCents(product, settings);

  const coverUrl = product.cover_image_path
    ? getPublicCoverUrl(product.cover_image_path)
    : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link
        href={product.category ? `/categoria/${product.category.slug}` : "/"}
        className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
      >
        ← {product.category?.name ?? "Catálogo"}
      </Link>

      <div className="mt-4 grid grid-cols-1 gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-900">
            {coverUrl ? (
              <Image src={coverUrl} alt={product.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-zinc-400">
                Sin portada
              </div>
            )}
          </div>

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
        </div>

        <div className="lg:col-span-2">
          <div className="lg:sticky lg:top-24 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
            <h1 className="text-2xl font-bold tracking-tight">{product.title}</h1>
            <p className="mt-3 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              {formatPrice(product.price_cents, product.currency)}
            </p>

            <form method="POST" className="mt-6 flex flex-col gap-3">
              <input type="hidden" name="product_id" value={product.id} />
              <label className="text-sm font-medium">
                Nombre completo
                <input
                  type="text"
                  name="full_name"
                  required
                  placeholder="Tu nombre y apellido"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
              <label className="text-sm font-medium">
                Tu email
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="vos@email.com"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>

              <button
                type="submit"
                formAction="/api/checkout"
                className="rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700"
              >
                Pagar con Mercado Pago
              </button>
              <p className="text-center text-xs text-zinc-500">Tarjeta o Yape, en soles.</p>

              <div className="flex items-center gap-3 py-1 text-xs text-zinc-400">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                o
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <button
                type="submit"
                formAction="/api/checkout/paypal"
                className="rounded-lg border-2 border-[#003087] px-4 py-3 font-semibold text-[#003087] transition hover:bg-[#003087]/5 dark:border-[#4593e0] dark:text-[#4593e0]"
              >
                Pagar con PayPal ({formatPrice(usdCents, "USD")})
              </button>
              <p className="text-center text-xs text-zinc-500">
                Para compradores fuera de Perú, en dólares.
              </p>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
