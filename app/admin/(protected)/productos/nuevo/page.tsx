import { getCategories } from "@/lib/db/categories";
import { getStoreSettings } from "@/lib/db/settings";
import { createProductAction } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, settings] = await Promise.all([getCategories(), getStoreSettings()]);

  return (
    <div>
      <h1 className="text-xl font-semibold">Nuevo producto</h1>
      <div className="mt-6">
        <ProductForm action={createProductAction} categories={categories} settings={settings} />
      </div>
    </div>
  );
}
