import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";
import { signOutAction } from "@/lib/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <nav className="flex gap-4 text-sm font-medium">
            <Link href="/admin/productos">Productos</Link>
            <Link href="/admin/categorias">Categorías</Link>
            <Link href="/admin/ordenes">Órdenes</Link>
            <Link href="/" className="text-zinc-500">
              Ver tienda ↗
            </Link>
          </nav>
          <form action={signOutAction}>
            <button type="submit" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
