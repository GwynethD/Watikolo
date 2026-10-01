import { Link } from 'react-router-dom';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';

const heroImage = new URL('../../pictures/villa.png', import.meta.url).href;

const gallerySections = [
  {
    title: 'Main Villa',
    images: [
      { src: heroImage, alt: 'Watikolo villa at night' },
      { src: new URL('../../pictures/watikolo-main.png', import.meta.url).href, alt: 'Watikolo main exterior' },
      { src: new URL('../../pictures/watikolo-home.png', import.meta.url).href, alt: 'Watikolo home interior' },
      { src: new URL('../../pictures/watikolo-2.png', import.meta.url).href, alt: 'Watikolo venue highlight' },
      { src: new URL('../../pictures/balcony.jpg', import.meta.url).href, alt: 'Watikolo balcony area' },
    ],
  },
  {
    title: 'Pool Area',
    images: [
      { src: new URL('../../pictures/watikolo-lpool.png', import.meta.url).href, alt: 'Watikolo L-shaped pool' },
      { src: new URL('../../pictures/w-pool.png', import.meta.url).href, alt: 'Watikolo pool view', objectPosition: 'center bottom' },
    ],
  },
  {
    title: 'Event Space',
    images: [
      { src: new URL('../../pictures/watikolo-function.png', import.meta.url).href, alt: 'Watikolo function hall' },
      { src: new URL('../../pictures/function.png', import.meta.url).href, alt: 'Watikolo event setup' },
      { src: new URL('../../pictures/function1.png', import.meta.url).href, alt: 'Watikolo event space detail' },
      { src: new URL('../../pictures/space.jpg', import.meta.url).href, alt: 'Watikolo open space' },
      { src: new URL('../../pictures/outside1.png', import.meta.url).href, alt: 'Watikolo outdoor angle one' },
      { src: new URL('../../pictures/outside2.png', import.meta.url).href, alt: 'Watikolo outdoor angle two' },
    ],
  },
  {
    title: 'Outdoor Area',
    images: [
      { src: new URL('../../pictures/outside.png', import.meta.url).href, alt: 'Watikolo exterior grounds' },
      { src: new URL('../../pictures/nature.jpg', import.meta.url).href, alt: 'Watikolo nature view' },
      { src: new URL('../../pictures/nature1.jpg', import.meta.url).href, alt: 'Watikolo garden view' },
    ],
  },
  {
    title: 'Rooms',
    images: [
      { src: new URL('../../pictures/room1.jpg', import.meta.url).href, alt: 'Watikolo room one' },
      { src: new URL('../../pictures/room2.jpg', import.meta.url).href, alt: 'Watikolo room two' },
      { src: new URL('../../pictures/room3.jpg', import.meta.url).href, alt: 'Watikolo room three' },
    ],
  },
];

const photoCount = gallerySections.reduce((count, section) => count + section.images.length, 0);

export function GalleryPage() {
  return (
    <div className="bg-white font-body">
      <PublicBannerImage image={heroImage} alt="Watikolo gallery banner" />

      <section className="mx-auto max-w-[1180px] px-4 py-9">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold uppercase text-[#222]">Gallery</h1>
            <p className="mt-10 max-w-3xl text-[13px] leading-6 text-slate-500">
              A complete visual preview of the venue, guest rooms, event spaces, pool areas, and outdoor settings.
            </p>
            <p className="mt-2 text-xs text-slate-400">{photoCount} photos</p>
          </div>

          <Link
            to="/venues"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#0f4da0] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b3f82]"
          >
            Book now
          </Link>
        </div>

        <div className="mt-8 space-y-9">
          {gallerySections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold text-[#222]">{section.title}</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.images.map((image) => (
                  <div key={image.alt} className="aspect-[3/2] overflow-hidden rounded-xl border border-slate-100 shadow-card">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="h-full w-full object-cover"
                      style={{ objectPosition: image.objectPosition ?? 'center' }}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </div>
  );
}

