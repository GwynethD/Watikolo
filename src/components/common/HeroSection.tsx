import { HeroDateRangePicker } from '@/components/common/HeroDateRangePicker';

export function HeroSection() {
  const heroImage = new URL('../../pictures/villa.png', import.meta.url).href;

  return (
    <section className="pb-4">
      <div className="relative overflow-hidden bg-[#cfe8ef] shadow-soft">
        <img
          src={heroImage}
          alt="Watikolo night villa with illuminated pool"
          className="h-[420px] w-full object-cover object-center sm:h-[540px] lg:h-[620px]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_52%,rgba(5,15,32,0.16)_100%)]" />

        <div className="absolute inset-x-0 bottom-3 p-4 sm:bottom-4 sm:p-6 lg:bottom-6 lg:p-8">
          <div className="container-shell flex justify-end">
            <HeroDateRangePicker />
          </div>
        </div>
      </div>
    </section>
  );
}


