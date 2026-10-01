interface PublicBannerImageProps {
  image: string;
  alt: string;
}

export function PublicBannerImage({ image, alt }: PublicBannerImageProps) {
  return (
    <section>
      <img src={image} alt={alt} className="h-[340px] w-full object-cover object-center sm:h-[420px] lg:h-[560px]" />
    </section>
  );
}
