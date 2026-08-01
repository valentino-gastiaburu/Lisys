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
    <section className="relative overflow-hidden">
      {imageUrl && (
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
      )}

      <div
        className={`relative mx-auto max-w-6xl px-6 py-20 text-center sm:py-28 ${
          imageUrl ? "text-white" : ""
        }`}
      >
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
