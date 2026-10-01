import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { AccommodationPlanner } from '@/components/venue/AccommodationPlanner';

const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;

export function VenueDetailsPage() {
  const { id } = useParams();
  const [activeView, setActiveView] = useState<'rates' | 'rooms'>('rates');

  return (
    <div className="bg-[#fbfaf6] font-body">
      <PublicBannerImage image={bannerImage} alt="Watikolo venue details" />
      <div className="mx-auto max-w-6xl px-6 pt-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('rates')}
            className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${activeView === 'rates' ? 'bg-black text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            Rates
          </button>
          <button
            type="button"
            onClick={() => setActiveView('rooms')}
            className={`rounded-md px-3 py-1.5 text-[11px] font-semibold ${activeView === 'rooms' ? 'bg-black text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
          >
            Rooms
          </button>
        </div>
      </div>
      <AccommodationPlanner venueId={id} activeView={activeView} />
    </div>
  );
}
