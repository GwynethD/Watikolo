import { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, Star, Users } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppData } from '@/context/AppDataContext';
import { formatCurrency } from '@/utils/format';

interface AccommodationPlannerProps {
  venueId?: string;
}

const packages = [
  {
    name: 'Essential',
    price: 5000,
    minGuests: 30,
    inclusions: ['Pool access', 'Tables and chairs', 'Basic styling support'],
  },
  {
    name: 'Classic',
    price: 10000,
    minGuests: 50,
    inclusions: ['Function area', 'Guest tables', 'Photo-ready backdrop'],
  },
  {
    name: 'Premium',
    price: 15000,
    minGuests: 70,
    inclusions: ['Sound system', 'Upgraded styling', 'Expanded guest setup'],
  },
  {
    name: 'Deluxe',
    price: 20000,
    minGuests: 90,
    inclusions: ['Full venue access', '2 room inclusions', 'Event support'],
  },
  {
    name: 'Grand',
    price: 25000,
    minGuests: 120,
    inclusions: ['Decor setup', 'Extended venue use', '2 room inclusions'],
  },
  {
    name: 'Ultimate',
    price: 30000,
    minGuests: 150,
    inclusions: ['All access package', 'VIP styling', 'Priority support'],
  },
] as const;

const rooms = [
  {
    name: 'Watikolo Luxe Stay',
    image: new URL('../../pictures/room1.jpg', import.meta.url).href,
    capacity: 'Good for 2 persons',
    price: 1900,
    inclusions: ['Air conditioning', 'Private bathroom', 'Smart TV'],
  },
  {
    name: 'Watikolo Grand Room',
    image: new URL('../../pictures/room2.jpg', import.meta.url).href,
    capacity: 'Good for 3-4 persons',
    price: 2499,
    inclusions: ['Air conditioning', 'WiFi', 'Cozy bed'],
  },
  {
    name: 'Watikolo Family Room',
    image: new URL('../../pictures/room3.jpg', import.meta.url).href,
    capacity: 'Good for 4-6 persons',
    price: 3499,
    inclusions: ['Air conditioning', 'Private CR', 'Mini lounge'],
  },
] as const;

const timeSlots = ['Morning', 'Afternoon', 'Evening'] as const;

const serviceAddOns = [
  { name: 'Decor Styling', price: 2500, description: 'Themed setup for the event area.' },
  { name: 'Sound System Upgrade', price: 1800, description: 'Enhanced speakers and audio support.' },
  { name: 'Projector & Screen', price: 1500, description: 'Good for AVP and presentations.' },
  { name: 'Welcome Drinks', price: 1200, description: 'Prepared refreshments for arriving guests.' },
] as const;

const roomAddOns = rooms.map((room) => ({
  name: `${room.name} Add-On`,
  price: room.price,
  description: room.capacity,
  image: room.image,
  type: 'room' as const,
}));

const allAddOns = [
  ...serviceAddOns.map((item) => ({ ...item, type: 'service' as const })),
  ...roomAddOns,
];

const roomAddOnNames = roomAddOns.map((item) => item.name);

export function AccommodationPlanner({ venueId }: AccommodationPlannerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { venues } = useAppData();
  const venue = useMemo(() => venues.find((item) => item.id === venueId) ?? venues[0], [venueId, venues]);
  const initialPackageIndex = Math.min(Math.max(Number(searchParams.get('package') ?? 0) || 0, 0), packages.length - 1);

  const [activeTab, setActiveTab] = useState<'rates' | 'rooms'>('rates');
  const [selectedPackage, setSelectedPackage] = useState(initialPackageIndex);
  const [selectedTime, setSelectedTime] = useState<string | null>(timeSlots[0]);
  const [guestCount, setGuestCount] = useState<number>(packages[initialPackageIndex].minGuests);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  useEffect(() => {
    const packageIndex = Math.min(Math.max(Number(searchParams.get('package') ?? 0) || 0, 0), packages.length - 1);
    setSelectedPackage(packageIndex);
  }, [searchParams]);

  const pkg = packages[selectedPackage];
  const canAddRooms = selectedPackage <= 2;
  const availableAddOns = canAddRooms
    ? [...serviceAddOns.map((item) => ({ ...item, type: 'service' as const })), ...roomAddOns]
    : serviceAddOns.map((item) => ({ ...item, type: 'service' as const }));

  useEffect(() => {
    if (!canAddRooms) {
      setSelectedAddOns((current) => current.filter((item) => !roomAddOnNames.includes(item)));
    }
  }, [canAddRooms]);

  const selectedAddOnDetails = allAddOns.filter((item) => selectedAddOns.includes(item.name));
  const extraGuests = guestCount > pkg.minGuests ? (guestCount - pkg.minGuests) * 100 : 0;
  const addOnsTotal = selectedAddOnDetails.reduce((sum, item) => sum + item.price, 0);
  const total = pkg.price + extraGuests + addOnsTotal;
  const detailPath = `/venues/${venue.id}`;

  const toggleAddOn = (name: string) => {
    setSelectedAddOns((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  };

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <div className="border-b bg-[#f5f5f5]">
        <div className="px-0 py-8">
          <h1 className="font-display text-2xl font-semibold text-[#1f1f1f]">ACCOMMODATIONS</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            {venue.name} offers private resort packages, guest rooms, and a guided reservation flow you can review before booking.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-card">
              <MapPin className="h-4 w-4 text-[#5fa7c9]" />
              {venue.location}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-card">
              <Users className="h-4 w-4 text-[#5fa7c9]" />
              Up to {venue.capacity} guests
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-card">
              <Star className="h-4 w-4 fill-current text-gold-500" />
              {venue.rating} rating
            </span>
          </div>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab('rates')}
              className={`px-4 py-2 ${activeTab === 'rates' ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              RATES
            </button>
            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-4 py-2 ${activeTab === 'rooms' ? 'bg-black text-white' : 'bg-gray-200'}`}
            >
              ROOMS & VILLAS
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 py-6 lg:grid-cols-[2fr_1fr]">
        <div>
          {activeTab === 'rates' ? (
            <div className="rounded-2xl bg-white p-8 shadow">
              <img src={venue.heroImage} alt={venue.name} className="mb-6 h-[300px] w-full rounded-xl object-cover" />

              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0f4da0]">Event Packages</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#202321]">Choose your ideal package</h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {packages.map((item, index) => {
                  const selected = selectedPackage === index;

                  return (
                    <div key={item.name} className={`rounded-xl border p-4 ${selected ? 'border-[#0f4da0] bg-[#edf4ff]' : 'bg-[#f8f8f8]'}`}>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0f4da0]">Package {index + 1}</p>
                      <h3 className="mt-2 font-semibold text-[#202321]">{item.name}</h3>
                      <p className="mt-2 text-sm text-slate-500">Starting from</p>
                      <p className="text-lg font-bold text-[#202321]">{formatCurrency(item.price)}</p>
                      <p className="mt-2 text-xs text-slate-500">Good for at least {item.minGuests} guests</p>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPackage(index)}
                          className="rounded-md bg-black px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-white"
                        >
                          Select
                        </button>
                        <Link
                          to={`${detailPath}?package=${index}`}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-700"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-2xl border border-[#ece2d0] bg-[#fcfbf8] p-5">
                <div className="flex items-center justify-between gap-3 border-b border-[#ece2d0] pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Selected package</p>
                    <h3 className="mt-2 text-2xl font-semibold text-[#202321]">{pkg.name}</h3>
                  </div>
                  <span className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">{formatCurrency(pkg.price)}</span>
                </div>

                <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Inclusions</p>
                    <div className="mt-3 grid gap-3">
                      {pkg.inclusions.map((inclusion) => (
                        <div key={inclusion} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                          <Check className="h-4 w-4 text-gold-500" />
                          {inclusion}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Time Slot</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {timeSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTime(slot)}
                          className={`rounded-md px-4 py-2 text-sm ${selectedTime === slot ? 'bg-black text-white' : 'bg-white border border-slate-200 text-slate-700'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5">
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Guests</label>
                      <input
                        type="number"
                        min={pkg.minGuests}
                        value={guestCount}
                        onChange={(event) => setGuestCount(Number(event.target.value))}
                        className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Additional Add-Ons</p>
                  <span className="text-xs text-slate-400">
                    {canAddRooms ? 'Rooms available for this package' : 'Room add-ons only for Packages 1-3'}
                  </span>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {availableAddOns.map((item) => {
                    const selected = selectedAddOns.includes(item.name);

                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => toggleAddOn(item.name)}
                        className={`overflow-hidden rounded-2xl border text-left transition ${selected ? 'border-[#0f4da0] bg-[#edf4ff]' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        {item.type === 'room' ? <img src={item.image} alt={item.name} className="h-28 w-full object-cover" /> : null}
                        <div className="px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#202321]">{item.name}</p>
                              <p className="mt-1 text-xs text-slate-500">{item.description}</p>
                            </div>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${item.type === 'room' ? 'bg-[#f8f2e5] text-[#9a6b19]' : 'bg-[#f1f5f9] text-slate-600'}`}>
                              {item.type === 'room' ? 'Room' : 'Add-On'}
                            </span>
                          </div>
                          <p className="mt-3 text-xs font-semibold text-[#0f4da0]">{formatCurrency(item.price)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {rooms.map((room) => (
                <div key={room.name} className="flex flex-col rounded-2xl bg-white shadow md:flex-row">
                  <img src={room.image} alt={room.name} className="object-cover md:w-[35%]" />

                  <div className="flex-1 p-6">
                    <h2 className="text-lg font-semibold text-[#202321]">{room.name}</h2>
                    <p className="text-sm text-gray-500">{room.capacity}</p>
                    <p className="mt-3 text-lg font-bold text-[#202321]">{formatCurrency(room.price)}</p>

                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                      {room.inclusions.map((inclusion) => (
                        <div key={inclusion}>- {inclusion}</div>
                      ))}
                    </div>
                  </div>

                  <div className="flex w-[220px] items-center justify-center border-l p-6">
                    <Link to={detailPath} className="bg-black px-4 py-2 text-sm text-white">
                      VIEW DETAILS
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="sticky top-24 h-fit rounded-[1.75rem] border border-[#e9dfcc] bg-white p-6 shadow-lg shadow-slate-200/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0f4da0]">Booking Summary</p>
              <h2 className="mt-2 text-2xl font-semibold text-[#202321]">Your stay estimate</h2>
            </div>
            <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-xs font-semibold text-[#0f4da0]">Live</span>
          </div>

          <div className="mt-6 rounded-2xl border border-[#ece2d0] bg-[#fcfbf8] p-4">
            <div className="flex items-center justify-between gap-3 border-b border-[#ece2d0] pb-3">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Venue</p>
                <p className="mt-1 font-semibold text-[#202321]">{venue.name}</p>
              </div>
              <span className="rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">{formatCurrency(pkg.price)}</span>
            </div>

            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <dt>Selected package</dt>
                <dd className="font-medium text-[#202321]">{pkg.name}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Time slot</dt>
                <dd className="font-medium text-[#202321]">{selectedTime ?? 'Choose a schedule'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Guest count</dt>
                <dd className="font-medium text-[#202321]">{guestCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Included guests</dt>
                <dd className="font-medium text-[#202321]">{pkg.minGuests}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Package Inclusions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {pkg.inclusions.map((inclusion) => (
                <span key={inclusion} className="rounded-full bg-[#f3efe6] px-3 py-2 text-xs font-medium text-[#202321]">
                  {inclusion}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-[#ece2d0] bg-[#fcfbf8] p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Additional Add-Ons</p>
              <span className="text-xs font-semibold text-[#0f4da0]">{selectedAddOns.length} selected</span>
            </div>

            {selectedAddOns.length > 0 ? (
              <div className="mt-3 space-y-2">
                {selectedAddOnDetails.map((item) => (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-sm text-slate-600">
                    <div>
                      <span>{item.name}</span>
                      <p className="text-xs text-slate-400">{item.description}</p>
                    </div>
                    <span className="font-medium text-[#202321]">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">No add-ons selected yet.</p>
            )}
          </div>

          <div className="mt-6 rounded-2xl bg-[#f7f7f7] p-4">
            <div className="flex items-center justify-between text-sm text-slate-600">
              <span>Package rate</span>
              <span className="font-medium text-[#202321]">{formatCurrency(pkg.price)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Extra guest fee</span>
              <span className="font-medium text-[#202321]">{formatCurrency(extraGuests)}</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
              <span>Add-ons</span>
              <span className="font-medium text-[#202321]">{formatCurrency(addOnsTotal)}</span>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[#202321]">Estimated total</span>
                <span className="text-xl font-bold text-[#0f4da0]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`/booking?venueId=${venue.id}`)}
            className="mt-6 w-full rounded-xl bg-[#0f4da0] py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-[#0b3e82]"
          >
            Book Now
          </button>
        </aside>
      </div>
    </section>
  );
}

