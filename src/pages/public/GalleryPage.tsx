import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { SectionHeader } from '@/components/common/SectionHeader';

const heroImage = new URL('../../pictures/villa.png', import.meta.url).href;

const galleryImages = [
  { src: heroImage, alt: 'Watikolo villa at night', featured: true },
  { src: new URL('../../pictures/watikolo-main.png', import.meta.url).href, alt: 'Watikolo main exterior' },
  { src: new URL('../../pictures/watikolo-home.png', import.meta.url).href, alt: 'Watikolo home interior' },
  { src: new URL('../../pictures/watikolo-function.png', import.meta.url).href, alt: 'Watikolo function hall' },
  { src: new URL('../../pictures/watikolo-lpool.png', import.meta.url).href, alt: 'Watikolo L-shaped pool' },
  { src: new URL('../../pictures/w-pool.png', import.meta.url).href, alt: 'Watikolo pool view' },
  { src: new URL('../../pictures/watikolo-2.png', import.meta.url).href, alt: 'Watikolo venue highlight' },
  { src: new URL('../../pictures/function.png', import.meta.url).href, alt: 'Watikolo event setup' },
  { src: new URL('../../pictures/function1.png', import.meta.url).href, alt: 'Watikolo event space detail' },
  { src: new URL('../../pictures/outside.png', import.meta.url).href, alt: 'Watikolo exterior grounds' },
  { src: new URL('../../pictures/outside1.png', import.meta.url).href, alt: 'Watikolo outdoor angle one' },
  { src: new URL('../../pictures/outside2.png', import.meta.url).href, alt: 'Watikolo outdoor angle two' },
  { src: new URL('../../pictures/nature.jpg', import.meta.url).href, alt: 'Watikolo nature view' },
  { src: new URL('../../pictures/nature1.jpg', import.meta.url).href, alt: 'Watikolo garden view' },
  { src: new URL('../../pictures/space.jpg', import.meta.url).href, alt: 'Watikolo open space' },
  { src: new URL('../../pictures/balcony.jpg', import.meta.url).href, alt: 'Watikolo balcony area' },
  { src: new URL('../../pictures/room1.jpg', import.meta.url).href, alt: 'Watikolo room one' },
  { src: new URL('../../pictures/room2.jpg', import.meta.url).href, alt: 'Watikolo room two' },
  { src: new URL('../../pictures/room3.jpg', import.meta.url).href, alt: 'Watikolo room three' },
];

export function GalleryPage() {
  return (
    <div className="bg-[#fbfaf6] font-body">
      <PublicBannerImage image={heroImage} alt="Watikolo gallery banner" />

      <section className="container-shell py-16 sm:py-20">
        <SectionHeader
          title="GALLERY"
          description="A complete visual preview of the venue, guest rooms, event spaces, pool areas, and outdoor settings for your public gallery."
          compact
        />

        <div className="mt-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b48332]">Photo Collection</p>
            <h3 className="mt-3 font-display text-3xl font-semibold text-[#202321] sm:text-4xl">
              All venue photos in one gallery page
            </h3>
          </div>
          <p className="text-sm text-slate-500">{galleryImages.length} images</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {galleryImages.map((image, index) => (
            <div
              key={`${image.alt}-${index}`}
              className={`overflow-hidden rounded-[2rem] border border-[#ece2d0] bg-white shadow-card ${image.featured ? 'md:col-span-2 xl:col-span-2' : ''}`}
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className={`w-full object-cover transition duration-300 hover:scale-[1.02] ${image.featured ? 'h-[360px] sm:h-[420px]' : 'h-[260px] sm:h-[300px]'}`}
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

