import { CalendarDays, Clock3, Sparkles, Users, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { SectionHeader } from '@/components/common/SectionHeader';

const activities = [
  {
    icon: Sparkles,
    title: 'Host milestone celebrations',
    text: 'Perfect for birthdays, reunions, intimate weddings, and memorable private gatherings.',
  },
  {
    icon: Waves,
    title: 'Enjoy the poolside space',
    text: 'The swimming pool and surrounding lounge area help the venue feel more like a resort getaway.',
  },
  {
    icon: Users,
    title: 'Bring families and groups together',
    text: 'Open spaces and accommodation options make the venue comfortable for larger group experiences.',
  },
  {
    icon: CalendarDays,
    title: 'Plan by schedule',
    text: 'Guests can understand the booking flow through visible time-slot options and clear date selection.',
  },
] as const;

const slots = [
  '8:00 AM - 12:00 PM',
  '1:00 PM - 5:00 PM',
  '6:00 PM - 10:00 PM',
] as const;

export function ThingsToDoPage() {
  const heroImage = new URL('../../pictures/villa.png', import.meta.url).href;
  const poolImage = new URL('../../pictures/watikolo-lpool.png', import.meta.url).href;

  return (
    <div className="bg-[#fbfaf6] font-body">
      <PublicBannerImage image={heroImage} alt="Watikolo things to do banner" />

      <section className="container-shell py-16 sm:py-20">
        <SectionHeader
          title="THINGS TO DO"
          description="From private celebrations to poolside moments and overnight stays, Watikolo is presented as a complete guest experience."
          compact
        />

        <div className="grid gap-6 md:grid-cols-2">
          {activities.map((item) => (
            <article key={item.title} className="rounded-[2rem] border border-[#ece2d0] bg-white p-6 shadow-card">
              <item.icon className="h-6 w-6 text-[#0f4da0]" />
              <h2 className="mt-4 text-2xl font-semibold text-[#202321]">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container-shell pb-16">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div className="overflow-hidden rounded-[2rem] border border-[#ece2d0] bg-white shadow-card">
            <img src={poolImage} alt="Watikolo pool" className="h-[360px] w-full object-cover" />
          </div>

          <div className="rounded-[2rem] border border-[#ece2d0] bg-white p-8 shadow-card">
            <Clock3 className="h-6 w-6 text-[#0f4da0]" />
            <h2 className="mt-4 font-display text-3xl font-semibold text-[#202321]">Time-slot scheduling keeps the experience organized.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              The booking system supports a simple schedule pattern that is easy for guests to understand and easy for admins to manage.
            </p>

            <div className="mt-6 space-y-3">
              {slots.map((slot) => (
                <div key={slot} className="rounded-2xl bg-[#f8f3ea] px-5 py-4 text-sm font-semibold text-[#202321]">
                  {slot}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/booking"
                className="inline-flex items-center justify-center rounded-full bg-[#0f4da0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3e82]"
              >
                Try booking
              </Link>
              <Link
                to="/venues"
                className="inline-flex items-center justify-center rounded-full border border-[#d9d4c7] bg-white px-6 py-3 text-sm font-semibold text-[#202321] transition hover:bg-[#faf8f2]"
              >
                View venue options
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

