import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { aboutPageService } from '@/services/aboutPageService';
import type { AboutPageContent } from '@/types';

export function AboutPage() {
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
  const [content, setContent] = useState<AboutPageContent | null>(null);

  useEffect(() => {
    let isMounted = true;

    aboutPageService.getContent().then((pageContent) => {
      if (isMounted) {
        setContent(pageContent);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const scrollToWhy = () => {
    whyRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getSection = (id: string) => content?.sections.find((section) => section.id === id);
  const sanctuarySection = getSection('sanctuary');
  const peacefulSection = getSection('peaceful-private');
  const celebrationSection = getSection('celebration-space');
  const designedSection = getSection('designed-spaces');
  const serviceSection = getSection('service');

  return (
    <div className="bg-white font-body">
      <section>
        <img src={content?.heroImage ?? new URL('../../pictures/villa.png', import.meta.url).href} alt="Watikolo villa exterior" className="h-[450px] w-full object-cover" />
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

      <section ref={whyRef} className="py-10">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-display text-2xl font-semibold text-[#1f1f1f]">
            {sanctuarySection?.title ?? 'About Watikolo'}
          </h2>

          <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
            {sanctuarySection?.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 rounded-[18px] bg-[#f7f9fb] px-6 py-8 shadow-[0_18px_45px_rgba(15,35,55,0.08)] sm:px-8 lg:px-10">
            <h2 className="text-center font-display text-2xl font-semibold text-[#1f1f1f]">Booking &amp; Walk-In Policy</h2>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <h3 className="text-base font-semibold text-[#254b63]">Booking Policy</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-600">
                  {content?.bookingPolicy.map((policy) => <li key={policy}>{policy}</li>)}
                </ul>
              </div>

              <div>
                <h3 className="text-base font-semibold text-[#254b63]">Walk-In Guests</h3>
                <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-6 text-slate-600">
                  {content?.walkInPolicy.map((policy) => <li key={policy}>{policy}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                to="/booking"
                className="rounded-full bg-[#0d559d] px-7 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-[#0a4580]"
              >
                Reserve Your Date Now
              </Link>
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-[#1f1f1f]">{peacefulSection?.title}</h2>

            <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
              {peacefulSection?.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            </div>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <img src={natureImage} alt="Watikolo nature view" className="h-[500px] w-full rounded-xl object-cover" />
            <img src={natureAltImage} alt="Watikolo garden view" className="h-[500px] w-full rounded-xl object-cover" />
            <img src={outsideOneImage} alt="Watikolo exterior angle one" className="h-[500px] w-full rounded-xl object-cover" />
            <img src={outsideTwoImage} alt="Watikolo exterior angle two" className="h-[500px] w-full rounded-xl object-cover" />
          </div>

          <div className="mt-10">
            <h2 className="font-display text-xl font-semibold text-[#1f1f1f]">{celebrationSection?.title}</h2>

            <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
              {celebrationSection?.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
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
              <h2 className="font-display text-xl font-semibold text-[#1f1f1f]">{designedSection?.title}</h2>

              <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
                {designedSection?.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </div>
          </section>

          <section className="mt-10">
            <div className="overflow-hidden rounded-2xl border shadow-card">
              <img src={homeImage} alt="Watikolo poolside highlight" className="h-[1000px] w-full object-cover" />
            </div>

            <div className="mt-6">
              <h2 className="font-display text-xl font-semibold text-[#1f1f1f]">{serviceSection?.title}</h2>

              <div className="mt-3 space-y-3 leading-relaxed text-gray-600">
                {serviceSection?.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
