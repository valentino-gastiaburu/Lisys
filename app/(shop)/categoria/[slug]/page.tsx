import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getCategoryBySlug } from "@/lib/db/categories";
import { getPublishedProducts } from "@/lib/db/products";

export const dynamic = "force-dynamic";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const products = await getPublishedProducts({ categoryId: category.id });

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
        ← Catálogo
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">{category.name}</h1>
      {category.description && (
        <p className="mt-2 max-w-xl text-zinc-600 dark:text-zinc-400">{category.description}</p>
      )}

      {products.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-zinc-300 py-16 text-center text-zinc-500 dark:border-zinc-700">
          Todavía no hay productos en esta categoría.
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}
