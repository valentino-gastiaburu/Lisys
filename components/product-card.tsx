import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { getPublicCoverUrl } from "@/lib/storage/files";
import type { ProductWithCategory } from "@/lib/types";

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const coverUrl = product.cover_image_path
    ? getPublicCoverUrl(product.cover_image_path)
    : null;

  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-900/5 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:shadow-black/40"
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
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        {product.category && (
          <span className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
            {product.category.name}
          </span>
        )}
        <h3 className="line-clamp-2 font-medium text-zinc-900 dark:text-zinc-50">
          {product.title}
        </h3>
        <p className="mt-auto pt-3 text-lg font-semibold">
          {formatPrice(product.price_cents, product.currency)}
        </p>
      </div>
    </Link>
  );
}
