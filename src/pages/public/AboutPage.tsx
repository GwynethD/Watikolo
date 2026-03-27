import { useRef } from 'react';
import { Link } from 'react-router-dom';

export function AboutPage() {
  const heroImage = new URL('../../pictures/villa.png', import.meta.url).href;
  const featureImage = new URL('../../pictures/w-pool.png', import.meta.url).href;
  const mainImage = new URL('../../pictures/outside.png', import.meta.url).href;
  const natureImage = new URL('../../pictures/nature.jpg', import.meta.url).href;
  const natureAltImage = new URL('../../pictures/nature1.jpg', import.meta.url).href;
  const outsideOneImage = new URL('../../pictures/outside1.png', import.meta.url).href;
  const outsideTwoImage = new URL('../../pictures/outside2.png', import.meta.url).href;
  const watikoloHighlightImage = new URL('../../pictures/watikolo-2.png', import.meta.url).href;
  const functionImage = new URL('../../pictures/function.png', import.meta.url).href;
  const functionAltImage = new URL('../../pictures/function1.png', import.meta.url).href;
  const spaceImage = new URL('../../pictures/space.jpg', import.meta.url).href;
  const balconyImage = new URL('../../pictures/balcony.jpg', import.meta.url).href;
  const homeImage = new URL('../../pictures/watikolo-home.png', import.meta.url).href;

  const whyRef = useRef<HTMLDivElement | null>(null);

  const scrollToWhy = () => {
    whyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-white font-body">
      <section>
        <img src={heroImage} alt="Watikolo villa exterior" className="h-[450px] w-full object-cover" />
      </section>

      <section className="py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">ABOUT</h2>

            <div className="mt-4">
              <button
                onClick={scrollToWhy}
                className="bg-[#1f1f1f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
              >
                WHY STAY WITH US
              </button>
            </div>
          </div>

          <Link
            to="/booking"
            className="rounded-md bg-[#1f1f1f] px-6 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            BOOK NOW
          </Link>
        </div>
      </section>

      <section className="py-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-2xl border shadow-card">
            <img src={featureImage} alt="Watikolo poolside experience" className="h-[1000px] w-full object-cover" />
          </div>
        </div>
      </section>

      <section ref={whyRef} className="py-10">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">
            Welcome to Your Sanctuary: Why Choose Watikolo for Your Next Stay?
          </h2>

          <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
            <p>
              Watikolo is a uniquely coined name, created to sound warm, tropical, and unforgettable. Though it has no
              official dictionary meaning, its rhythm gently echoes the calm of flowing water and the serenity of an island
              breeze. Because it is an invented name, Watikolo holds the freedom to define its own story - a story of
              comfort, connection, and meaningful escapes.
            </p>

            <p>
              It represents a sanctuary where moments slow down and life feels lighter - a place where laughter fills open
              spaces, celebrations become timeless memories, and quiet mornings bring a sense of renewal. At Watikolo,
              every stay is designed to feel personal and sincere, blending privacy, nature, and thoughtful hospitality into
              one harmonious experience.
            </p>

            <p>
              More than just a destination, it is a feeling - one that welcomes you, embraces you, and invites you to
              return again and again. We warmly invite you to experience Watikolo - to celebrate, unwind, and simply feel
              at home. Your unforgettable stay awaits.
            </p>
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-2xl shadow-card">
            <img src={mainImage} alt="Watikolo outdoor venue view" className="h-[1000px] w-full object-cover" />
          </div>

          <div className="mt-6">
            <h2 className="font-display text-xl font-semibold text-[#1f1f1f]">Peaceful & Private</h2>

            <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
              <p>
                Thoughtfully set away from the busy crowds and city noise, Watikolo offers an exclusive space where your
                celebrations can unfold in comfort and privacy. Surrounded by open skies, tropical greenery, and a serene
                atmosphere, our venue creates the perfect backdrop for intimate gatherings and unforgettable occasions.
              </p>

              <p>
                We take pride in creating an environment where you can feel completely at ease. Our attentive staff is
                always on hand to ensure your needs are met while respecting your privacy. Whether you're here for a
                romantic escape, a family vacation, or a solo retreat, Watikolo offers the perfect blend of comfort and
                seclusion for an unforgettable stay.
              </p>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <img src={natureImage} alt="Watikolo nature view" className="h-[500px] w-full rounded-xl object-cover" />
            <img src={natureAltImage} alt="Watikolo garden view" className="h-[500px] w-full rounded-xl object-cover" />
            <img src={outsideOneImage} alt="Watikolo exterior angle one" className="h-[500px] w-full rounded-xl object-cover" />
            <img src={outsideTwoImage} alt="Watikolo exterior angle two" className="h-[500px] w-full rounded-xl object-cover" />
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-[#1f1f1f]">Your Exclusive Celebration Space</h2>

            <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
              <p>
                Watikolo offers beautifully curated spaces where guests can gather, celebrate, and relax. Each area
                provides private dining, comfortable lounges, and modern amenities, creating the perfect setting for
                memorable occasions.
              </p>
            </div>
          </div>

          <section className="mt-10">
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={watikoloHighlightImage} alt="Watikolo event space highlight" className="h-[1000px] w-full object-cover" />
            </div>
          </section>

          <section className="mt-10">
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={functionImage} alt="Watikolo function area" className="h-[1000px] w-full object-cover" />
            </div>
          </section>

          <section className="mt-10">
            <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <img src={functionAltImage} alt="Watikolo function area detail" className="h-[500px] w-full rounded-2xl object-cover" />
              <img src={spaceImage} alt="Watikolo open space" className="h-[500px] w-full rounded-2xl object-cover" />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl shadow-card">
              <img src={balconyImage} alt="Watikolo balcony area" className="h-[500px] w-full object-cover" />
            </div>

            <div className="mt-6">
              <h2 className="font-display text-xl font-semibold text-[#1f1f1f]">Thoughtfully Designed Spaces</h2>

              <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
                <p>
                  Watikolo is more than just a venue - it is a place where moments become lasting memories. From intimate
                  gatherings to grand celebrations, every corner is thoughtfully designed to bring people together in a
                  beautiful and relaxing setting.
                </p>

                <p>
                  Whether you're celebrating milestones or simply enjoying time with loved ones, Watikolo provides a space
                  where every experience feels special, meaningful, and unforgettable.
                </p>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={'.'} alt="Watikolo poolside highlight" className="h-[1000px] w-full object-cover" />
            </div>
          </section>

          <section className="mt-10">
            <div className="mt-6">
              <h2 className="font-display text-xl font-semibold text-[#1f1f1f]">Hospitable & Attentive Service</h2>

              <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
                <p>
                  At Watikolo, our team takes pride in creating a welcoming and seamless experience for every event. Our
                  attentive staff are always ready to assist, ensuring that every detail is carefully prepared so you can
                  focus on celebrating and enjoying your special occasion.
                </p>

                <p>
                  From personalized event planning to on-site support, we are dedicated to making your experience at
                  Watikolo truly unforgettable. Whether you're hosting an intimate gathering or a grand celebration, our
                  hospitable service is designed to make you and your guests feel cared for and valued throughout your stay.
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
