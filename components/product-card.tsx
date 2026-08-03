import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/types";

export function ProductCard({
  product,
  coverUrl,
  usdCents,
}: {
  product: ProductWithCategory;
  coverUrl: string | null;
  usdCents: number;
}) {
  const hasOffer =
    product.compare_at_price_cents != null && product.compare_at_price_cents > product.price_cents;

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-emerald-700/60 dark:hover:shadow-black/40"
    >
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={product.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sin portada
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {product.category && (
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur-sm dark:bg-zinc-900/85 dark:text-zinc-200">
              {product.category.name}
            </span>
          )}
        </div>
        {hasOffer && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-zinc-900 shadow-sm">
            Oferta
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-medium text-zinc-900 dark:text-zinc-50">
          {product.title}
        </h3>
        <div className="mt-auto pt-3">
          {hasOffer && (
            <span className="mr-1.5 text-sm text-zinc-400 line-through dark:text-zinc-600">
              {formatPrice(product.compare_at_price_cents!, product.currency)}
            </span>
          )}
          <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            {formatPrice(product.price_cents, product.currency)}
          </span>{" "}
          <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            / {formatPrice(usdCents, "USD")}
          </span>
        </div>
      </div>
    </Link>
  );
}
