import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { signOutAction } from "@/lib/actions/auth";
import { StorageUsageBadge } from "@/components/admin/storage-usage";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-bold text-zinc-900">
              LS
            </span>
            <nav className="flex gap-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">
              <Link href="/admin/productos" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">
                Productos
              </Link>
              <Link href="/admin/categorias" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">
                Categorías
              </Link>
              <Link href="/admin/ordenes" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">
                Órdenes
              </Link>
              <Link href="/admin/configuracion" className="transition hover:text-emerald-600 dark:hover:text-emerald-400">
                Configuración
              </Link>
              <Link href="/" className="text-zinc-400 transition hover:text-emerald-600 dark:hover:text-emerald-400">
                Ver tienda ↗
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <StorageUsageBadge />
            <form action={signOutAction}>
              <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
