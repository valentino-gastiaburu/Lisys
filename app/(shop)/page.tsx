import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getPublishedProducts } from "@/lib/db/products";
import { getCategories } from "@/lib/db/categories";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, categories] = await Promise.all([
    getPublishedProducts(),
    getCategories(),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6">
      <section className="py-16 text-center sm:py-24">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Cursos, plantillas y guías,{" "}
          <span className="text-indigo-600 dark:text-indigo-400">listos para usar</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Comprá con tarjeta y recibí el archivo al instante. Sin cuentas, sin vueltas.
        </p>

        {categories.length > 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categoria/${category.slug}`}
                className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition hover:border-indigo-500 hover:text-indigo-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
              >
                {category.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="pb-20">
        <h2 className="text-xl font-semibold">Todo el catálogo</h2>

        {products.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-zinc-300 py-16 text-center text-zinc-500 dark:border-zinc-700">
            Todavía no hay productos publicados.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
