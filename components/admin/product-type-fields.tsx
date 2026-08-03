"use client";

import { useState } from "react";
import type { ProductType, DeliveryType } from "@/lib/types";

export function ProductTypeFields({
  defaultProductType,
  defaultDeliveryType,
  defaultExternalLink,
  defaultAllowModulePurchase,
  defaultAllowVideoPurchase,
  fileInput,
  curriculumHref,
}: {
  defaultProductType: ProductType;
  defaultDeliveryType: DeliveryType;
  defaultExternalLink: string | null;
  defaultAllowModulePurchase: boolean;
  defaultAllowVideoPurchase: boolean;
  fileInput: React.ReactNode;
  curriculumHref: string | null;
}) {
  // A course's own link is optional even though the field name is shared
  // with "simple" products' delivery link.
  const defaultCourseLink = defaultProductType === "course" ? defaultExternalLink : null;
  const [productType, setProductType] = useState<ProductType>(
    defaultProductType === "course" ? "course" : "simple"
  );
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(defaultDeliveryType);

  return (
    <div className="flex flex-col gap-4">
      <label className="text-sm font-medium">
        Tipo de producto
        <select
          name="product_type"
          value={productType}
          onChange={(e) => setProductType(e.target.value as ProductType)}
          className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="simple">Simple</option>
          <option value="course">Curso</option>
        </select>
      </label>

      {productType === "simple" ? (
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <span className="text-sm font-medium">Modo de entrega</span>
          <div className="mt-2 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="delivery_type"
                value="file"
                checked={deliveryType === "file"}
                onChange={() => setDeliveryType("file")}
              />
              Archivo subido
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="delivery_type"
                value="link"
                checked={deliveryType === "link"}
                onChange={() => setDeliveryType("link")}
              />
              Link externo (Drive, YouTube no listado, etc.)
            </label>
          </div>

          <div className="mt-3">
            {deliveryType === "file" ? (
              fileInput
            ) : (
              <label className="text-sm font-medium">
                Link del producto
                <input
                  type="url"
                  name="external_link"
                  required
                  defaultValue={defaultExternalLink ?? ""}
                  placeholder="https://drive.google.com/..."
                  className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                />
              </label>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
          <label className="text-sm font-medium">
            Link del curso completo (opcional)
            <input
              type="url"
              name="external_link"
              defaultValue={defaultCourseLink ?? ""}
              placeholder="https://drive.google.com/..."
              className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <p className="mt-1 text-xs text-zinc-500">
            Si lo dejas vacío, comprar el curso entero entrega automáticamente todos los links de
            sus módulos/videos. Si pones un link aquí, se entrega únicamente ese.
          </p>

          <span className="mt-4 block text-sm font-medium">Compra por partes</span>
          <div className="mt-2 flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allow_module_purchase"
                defaultChecked={defaultAllowModulePurchase}
              />
              Permitir comprar por módulo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="allow_video_purchase"
                defaultChecked={defaultAllowVideoPurchase}
              />
              Permitir comprar por video
            </label>
          </div>
          {curriculumHref ? (
            <a
              href={curriculumHref}
              className="mt-3 inline-block text-sm font-medium text-emerald-600 underline dark:text-emerald-400"
            >
              Gestionar módulos y videos →
            </a>
          ) : (
            <p className="mt-3 text-xs text-zinc-500">
              Guardá el curso primero para poder agregar módulos y videos.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
