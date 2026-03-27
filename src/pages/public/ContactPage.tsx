import { Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { SectionHeader } from '@/components/common/SectionHeader';

const contactCards = [
  {
    icon: Phone,
    title: 'Phone',
    text: '+63 915 874 8529',
  },
  {
    icon: MapPin,
    title: 'Location',
    text: 'Purok 4, Upper Puntod Road, Tabalong, Dauis, Bohol, Philippines',
  },
  {
    icon: Mail,
    title: 'Booking flow',
    text: 'Use the frontend booking form to preview dates, schedules, and venue options.',
  },
] as const;

export function ContactPage() {
  const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;

  return (
    <div className="bg-[#fbfaf6] font-body">
      <PublicBannerImage image={bannerImage} alt="Watikolo contact banner" />

      <section className="container-shell py-16 sm:py-20">
        <SectionHeader
          title="CONTACT"
          description="Reach out for venue reservations, accommodation inquiries, and event planning through a cleaner public-facing contact experience."
          compact
        />

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {contactCards.map((card) => (
            <article key={card.title} className="rounded-[2rem] border border-[#ece2d0] bg-white p-6 shadow-card">
              <card.icon className="h-6 w-6 text-[#0f4da0]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#202321]">{card.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{card.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-[2rem] bg-[linear-gradient(135deg,#202321_0%,#103e79_130%)] px-8 py-10 text-white shadow-soft sm:px-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d8c99a]">Next Step</p>
          <h2 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
            Move from inquiry to booking with the guided public reservation flow.
          </h2>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/booking"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#202321] transition hover:bg-slate-100"
            >
              Start booking
            </Link>
            <a
              href="https://maps.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              View location
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

