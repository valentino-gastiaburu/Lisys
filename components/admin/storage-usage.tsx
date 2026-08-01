import { getStorageUsage, formatBytes } from "@/lib/storage/usage";

function barColor(pct: number) {
  if (pct > 90) return "bg-red-500";
  if (pct > 70) return "bg-amber-500";
  return "bg-emerald-500";
}

export async function StorageUsageBadge() {
  const usage = await getStorageUsage();
  const pct = Math.min(usage.percentUsed, 100);

  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className={`h-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      <span>{formatBytes(usage.totalBytes)} / 1 GB</span>
    </div>
  );
}

export async function StorageUsageCard() {
  const usage = await getStorageUsage();
  const pct = Math.min(usage.percentUsed, 100);

  return (
    <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <div className="flex items-center justify-between">
        <span className="font-medium">Almacenamiento</span>
        <span className="text-zinc-500">{formatBytes(usage.totalBytes)} de 1 GB usados</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
      </div>
      {pct > 90 ? (
        <p className="mt-2 text-xs text-red-600">
          Te estás quedando sin espacio — borrá algún producto que ya no vendas antes de subir
          archivos nuevos.
        </p>
      ) : pct > 70 ? (
        <p className="mt-2 text-xs text-amber-600">
          Vas superando el 70% del espacio gratuito. Conviene ir pensando qué productos podés
          bajar o reemplazar.
        </p>
      ) : null}
    </div>
  );
}
