import { CalendarDays, Clock3, Sparkles, Users, Waves } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { SectionHeader } from '@/components/common/SectionHeader';

const activities = [
  { icon: Sparkles, title: 'Book an event package', text: 'Reserve the venue for birthdays, weddings, reunions, corporate events, or private celebrations.' },
  { icon: Waves, title: 'Use the swimming pool', text: 'Choose day use or night use for walk-in swimming and simple poolside gatherings.' },
  { icon: Users, title: 'Reserve rooms', text: 'Add overnight rooms for families, guests, organizers, or event groups staying at the venue.' },
  { icon: CalendarDays, title: 'Check available schedules', text: 'Select a date and time slot before submitting a booking request.' },
] as const;

const slots = ['Daytime Use (8 Hours)', 'Night Use (5 Hours)'] as const;
const entranceFees = [
  { label: 'Day Use', time: '9:00 AM - 5:00 PM', kids: 'P50', adults: 'P100' },
  { label: 'Night Use', time: '5:30 PM - 10:30 PM', kids: 'P60', adults: 'P120' },
] as const;

export function ThingsToDoPage() {
  const heroImage = new URL('../../pictures/villa.png', import.meta.url).href;
  const poolImage = new URL('../../pictures/watikolo-lpool.png', import.meta.url).href;

  return (
    <div className="bg-[#fbfaf6] font-body">
      <PublicBannerImage image={heroImage} alt="Watikolo things to do banner" />
      <section className="mx-auto max-w-[1180px] px-4 py-9">
        <SectionHeader
          title="THINGS TO DO"
          description="Simple options guests can book or request through the Watikolo system."
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
      <section className="mx-auto max-w-[1180px] px-4 pb-9">
        <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-start">
          <div className="overflow-hidden rounded-[2rem] border border-[#ece2d0] bg-white shadow-card">
            <img src={poolImage} alt="Watikolo pool" className="h-[360px] w-full object-cover" />
          </div>
          <div className="rounded-[2rem] border border-[#ece2d0] bg-white p-8 shadow-card">
            <Clock3 className="h-6 w-6 text-[#0f4da0]" />
            <h2 className="mt-4 font-display text-3xl font-semibold text-[#202321]">Time-slot scheduling keeps the experience organized.</h2>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Choose an available schedule before sending a booking request.
            </p>
            <div className="mt-6 space-y-3">
              {slots.map((slot) => (
                <div key={slot} className="rounded-2xl bg-[#f8f3ea] px-5 py-4 text-sm font-semibold text-[#202321]">{slot}</div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-[#dbeafe] bg-[#f8fbff] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f4da0]">Walk-in Entrance Fee</p>
              <h3 className="mt-2 text-xl font-semibold text-[#202321]">Swimming pool entrance fee</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {entranceFees.map((fee) => (
                  <div key={fee.label} className="rounded-xl bg-white p-4 text-sm shadow-[0_8px_18px_rgba(19,33,45,0.04)]">
                    <p className="font-semibold text-[#0f4da0]">{fee.label}</p>
                    <p className="mt-1 text-xs text-slate-500">{fee.time}</p>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-[#f7f7f7] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Kids</p>
                        <p className="mt-1 font-bold text-[#202321]">{fee.kids}</p>
                      </div>
                      <div className="rounded-lg bg-[#f7f7f7] px-3 py-2">
                        <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">Adult</p>
                        <p className="mt-1 font-bold text-[#202321]">{fee.adults}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/booking" className="inline-flex items-center justify-center rounded-full bg-[#0f4da0] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#0b3e82]">Try booking</Link>
              <Link to="/venues" className="inline-flex items-center justify-center rounded-full border border-[#d9d4c7] bg-white px-6 py-3 text-sm font-semibold text-[#202321] transition hover:bg-[#faf8f2]">View venue options</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
