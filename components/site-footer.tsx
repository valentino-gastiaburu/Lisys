export function SiteFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-zinc-500 sm:flex-row">
        <p>© {new Date().getFullYear()} Lisys.</p>
        <p>Cursos, PDFs y plantillas — entrega inmediata por email.</p>
      </div>
    </footer>
  );
}
