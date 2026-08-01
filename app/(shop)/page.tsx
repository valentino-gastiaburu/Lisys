import { Hero } from "@/components/hero";
import { CatalogFilter } from "@/components/catalog-filter";
import { TrustSection } from "@/components/trust-section";
import { getPublishedProducts } from "@/lib/db/products";
import { getCategories } from "@/lib/db/categories";
import { getStoreSettings } from "@/lib/db/settings";
import { getPublicCoverUrl } from "@/lib/storage/files";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [products, categories, settings] = await Promise.all([
    getPublishedProducts(),
    getCategories(),
    getStoreSettings(),
  ]);

  const productsWithCovers = products.map((product) => ({
    ...product,
    coverUrl: product.cover_image_path ? getPublicCoverUrl(product.cover_image_path) : null,
  }));

  const heroImageUrl = settings.hero_image_path
    ? getPublicCoverUrl(settings.hero_image_path)
    : null;

  return (
    <>
      <Hero title={settings.hero_title} description={settings.hero_description} imageUrl={heroImageUrl} />

      <main className="mx-auto w-full max-w-6xl px-6">
        <CatalogFilter products={productsWithCovers} categories={categories} />
        <TrustSection />
      </main>
    </>
  );
}
