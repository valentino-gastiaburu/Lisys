"use client";

import type { ProductStatus } from "@/lib/types";

const LABELS: Record<ProductStatus, string> = {
  draft: "En proceso",
  published: "Activo",
  inactive: "Inactivo",
};

const COLORS: Record<ProductStatus, string> = {
  published: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  draft: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  inactive: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

export function StatusSelect({
  id,
  status,
  action,
}: {
  id: string;
  status: ProductStatus;
  action: (id: string, formData: FormData) => void;
}) {
  return (
    <form action={action.bind(null, id)}>
      <select
        name="status"
        defaultValue={status}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`rounded-full border-0 px-2 py-0.5 text-xs font-medium ${COLORS[status]}`}
      >
        {(Object.keys(LABELS) as ProductStatus[]).map((value) => (
          <option key={value} value={value}>
            {LABELS[value]}
          </option>
        ))}
      </select>
    </form>
  );
}
