import Image from "next/image";

export function Hero({
  title,
  description,
  imageUrl,
}: {
  title: string;
  description: string;
  imageUrl: string | null;
}) {
  return (
    <section className="relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-white dark:to-zinc-950" />
        </>
      ) : (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-emerald-300/40 blur-3xl dark:bg-emerald-500/20" />
          <div className="absolute top-10 right-0 h-80 w-80 rounded-full bg-sky-300/30 blur-3xl dark:bg-sky-500/10" />
          <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/10" />
        </div>
      )}

      <div
        className={`relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28 ${
          imageUrl ? "text-white" : ""
        }`}
      >
        {!imageUrl && (
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-white/70 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur-sm dark:border-emerald-900 dark:bg-zinc-900/70 dark:text-emerald-400">
            Entrega inmediata · Pago seguro
          </span>
        )}
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
        <p
          className={`mx-auto mt-4 max-w-xl text-lg ${
            imageUrl ? "text-zinc-100" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {description}
        </p>
      </div>
    </section>
  );
}
