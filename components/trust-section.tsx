export function TrustSection() {
  return (
    <section className="grid grid-cols-1 gap-4 pb-20 sm:grid-cols-2">
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-5 dark:border-red-900/50 dark:bg-red-950/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-400">
          Política de reembolso
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          Por tratarse de productos digitales, las ventas son finales. Si el archivo no te llega
          o está dañado, escribinos y te lo reenviamos o te devolvemos el pago sin vueltas.
        </p>
      </div>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          Soporte
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          ¿Tu compra no llegó o tenés una duda antes de pagar? Escribinos a{" "}
          <a href="mailto:soporte@lisys.com" className="font-medium underline underline-offset-2">
            soporte@lisys.com
          </a>{" "}
          y te respondemos a la brevedad.
        </p>
      </div>
    </section>
  );
}
