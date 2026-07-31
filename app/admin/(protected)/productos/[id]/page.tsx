import { notFound } from "next/navigation";
import { getCategories } from "@/lib/db/categories";
import { getProductByIdForAdmin } from "@/lib/db/products";
import { getStoreSettings } from "@/lib/db/settings";
import { updateProductAction } from "@/lib/actions/products";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [categories, product, settings] = await Promise.all([
    getCategories(),
    getProductByIdForAdmin(id),
    getStoreSettings(),
  ]);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold">Editar producto</h1>
      <div className="mt-6">
        <ProductForm
          action={updateProductAction.bind(null, id)}
          categories={categories}
          product={product}
          settings={settings}
        />
      </div>
    </div>
  );
}
