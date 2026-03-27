interface PublicPageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
}

export function PublicPageHero({ eyebrow, title, description, image }: PublicPageHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0f2745]">
      <img src={image} alt={title} className="h-[260px] w-full object-cover object-center sm:h-[320px] lg:h-[360px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,22,40,0.82)_0%,rgba(9,22,40,0.42)_45%,rgba(9,22,40,0.2)_100%)]" />

      <div className="absolute inset-0 flex items-center">
        <div className="container-shell text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d8c99a]">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}


