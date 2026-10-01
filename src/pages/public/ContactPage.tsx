import { Link } from 'react-router-dom';

export function ContactPage() {
  const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;

  return (
    <div className="bg-white font-body">
      <section>
        <img src={bannerImage} alt="Watikolo contact banner" className="h-[340px] w-full object-cover object-center sm:h-[420px] lg:h-[560px]" />
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-[1180px] px-4 py-9">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-semibold text-[#222]">Contact Us</h1>

            <p className="mt-10 text-[13px] leading-6 text-slate-500">
              Reach Watikolo easily for location questions, booking concerns, or quick directions before your visit.
            </p>

            <div className="mt-4 space-y-4 text-[13px] leading-6 text-slate-600">
              <div>
                <p className="font-semibold text-[#222]">Address</p>
                <p>P4 Upper Puntod Road Tabalong, Dauis, Philippines</p>
              </div>

              <div>
                <p className="font-semibold text-[#222]">Location</p>
                <a href="https://maps.app.goo.gl/ZQLSrCn1nNPaKFSW9" target="_blank" rel="noreferrer" className="text-[#0f4da0] hover:underline">
                  Click here to view our location.
                </a>
              </div>

              <div>
                <p className="font-semibold text-[#222]">Mobile</p>
                <a href="tel:+639158748529" className="text-[#0f4da0] hover:underline">
                  +63 915 874 8529
                </a>
              </div>
            </div>

            <Link
              to="/venues"
              className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#0f4da0] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0b3f82]"
            >
              Book now
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
