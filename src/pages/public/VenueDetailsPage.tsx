import { useParams } from 'react-router-dom';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';
import { AccommodationPlanner } from '@/components/venue/AccommodationPlanner';

const bannerImage = new URL('../../pictures/villa.png', import.meta.url).href;

export function VenueDetailsPage() {
  const { id } = useParams();

  return (
    <div className="bg-[#fbfaf6] font-body">
      <PublicBannerImage image={bannerImage} alt="Watikolo venue details" />
      <AccommodationPlanner venueId={id} />
    </div>
  );
}
