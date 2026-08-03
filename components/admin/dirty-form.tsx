"use client";

import { useState } from "react";

/**
 * Wraps an edit form so it's obvious at a glance whether there are unsaved
 * changes — plain server-action forms give zero feedback otherwise. The
 * save button is disabled and greyed out until something actually changes,
 * so it can never look "clickable" when there's nothing to save.
 */
export function DirtyForm({
  action,
  className,
  submitLabel,
  saved,
  children,
}: {
  action: (formData: FormData) => void;
  className?: string;
  submitLabel: string;
  /** Whether this exact item was the one just saved (from a redirect param). */
  saved?: boolean;
  children: React.ReactNode;
}) {
  const [dirty, setDirty] = useState(false);

  return (
    <form
      action={action}
      className={className}
      onChange={() => setDirty(true)}
      onSubmit={() => setDirty(false)}
    >
      {children}
      <button
        type="submit"
        disabled={!dirty}
        className={
          dirty
            ? "rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-500"
            : "cursor-not-allowed rounded-lg bg-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
        }
      >
        {submitLabel}
      </button>
      {dirty ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Cambios sin guardar
        </span>
      ) : (
        saved && (
          <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
            ✓ Guardado
          </span>
        )
      )}
    </form>
  );
}
