import { notFound } from "next/navigation";
import { getCategoryById } from "@/lib/db/categories";
import { updateCategoryAction } from "@/lib/actions/categories";
import { CategoryForm } from "@/components/admin/category-form";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = await getCategoryById(id);
  if (!category) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold">Editar categoría</h1>
      <div className="mt-6">
        <CategoryForm action={updateCategoryAction.bind(null, id)} category={category} />
      </div>
    </div>
  );
}
