"use client";

import { useId, useState } from "react";

export function FileInput({
  name,
  accept,
  required,
  label,
  hint,
  currentLabel,
  currentPreview,
}: {
  name: string;
  accept?: string;
  required?: boolean;
  label: string;
  hint?: string;
  /** Text describing the file already stored (e.g. its filename). */
  currentLabel?: string | null;
  /** Optional visual preview of the current file (e.g. a cover thumbnail). */
  currentPreview?: React.ReactNode;
}) {
  const id = useId();
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="text-sm font-medium">
      <span>{label}</span>
      {hint && <span className="ml-1 font-normal text-zinc-500">({hint})</span>}

      {(currentPreview || currentLabel) && (
        <div className="mt-2 flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900">
          {currentPreview}
          <span className="min-w-0 truncate text-xs font-normal text-zinc-500">
            Actual: {currentLabel}
          </span>
        </div>
      )}

      <div className="mt-2 flex items-center gap-3">
        <label
          htmlFor={id}
          className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Elegir archivo
        </label>
        <input
          id={id}
          type="file"
          name={name}
          accept={accept}
          required={required}
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="sr-only"
        />
        <span className="min-w-0 truncate text-sm font-normal text-zinc-500">
          {fileName ?? "Ningún archivo nuevo seleccionado"}
        </span>
      </div>
    </div>
  );
}
