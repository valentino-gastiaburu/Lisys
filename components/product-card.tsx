import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/types";

export function ProductCard({
  product,
  coverUrl,
}: {
  product: ProductWithCategory;
  coverUrl: string | null;
}) {
  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-900/10 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-amber-700/60 dark:hover:shadow-black/40"
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
        {product.category && (
          <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
            {product.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-2 font-medium text-zinc-900 dark:text-zinc-50">
          {product.title}
        </h3>
        <p className="mt-auto pt-3 text-lg font-bold text-amber-600 dark:text-amber-400">
          {formatPrice(product.price_cents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
