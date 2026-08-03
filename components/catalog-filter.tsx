"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import type { Category, ProductWithCategory } from "@/lib/types";

export interface ProductWithCover extends ProductWithCategory {
  coverUrl: string | null;
  usdCents: number;
}

export function CatalogFilter({
  products,
  categories,
}: {
  products: ProductWithCover[];
  categories: Category[];
}) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = !categoryId || product.category_id === categoryId;
      const matchesSearch =
        !query ||
        product.title.toLowerCase().includes(query) ||
        (product.description?.toLowerCase().includes(query) ?? false);
      return matchesCategory && matchesSearch;
    });
  }, [products, categoryId, search]);

  return (
    <section className="pb-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Todo el catálogo</h2>

        <div className="relative w-full sm:w-64">
          <SearchIcon />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
              categoryId === null
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
            }`}
          >
            Todas
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                categoryId === category.id
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-700 hover:border-emerald-500 hover:text-emerald-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-emerald-400 dark:hover:text-emerald-400"
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-zinc-300 py-16 text-center text-zinc-500 dark:border-zinc-700">
          {products.length === 0
            ? "Todavía no hay productos publicados."
            : "Ningún producto coincide con la búsqueda."}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} coverUrl={product.coverUrl} usdCents={product.usdCents} />
          ))}
        </div>
      )}
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
    >
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 1 0 3.61 9.65l3.62 3.62a.75.75 0 1 0 1.06-1.06l-3.62-3.62A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
