import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { AccommodationPlanner } from '@/components/venue/AccommodationPlanner';

const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;

export function VenuesPage() {
  return (
    <div className="bg-[#fbfaf6] font-body">
      <PublicBannerImage image={bannerImage} alt="Watikolo venue" />
      <AccommodationPlanner />
    </div>
  );
}
