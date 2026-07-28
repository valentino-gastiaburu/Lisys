import { getCategories } from "@/lib/db/categories";
import { createProductAction } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div>
      <h1 className="text-xl font-semibold">Nuevo producto</h1>
      <div className="mt-6">
        <ProductForm action={createProductAction} categories={categories} />
      </div>
    </div>
  );
}
