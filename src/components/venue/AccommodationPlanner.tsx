import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppData } from '@/context/AppDataContext';
import { formatCapacityLabel, formatCurrency, formatRoomCapacityLabel } from '@/utils/format';
import { Button } from '@/components/ui/Button';
import { addDays, toDateKey } from '@/utils/date';
import { unavailableRooms } from '@/utils/roomAvailability';

interface AccommodationPlannerProps {
  venueId?: string;
  activeView?: 'rates' | 'rooms';
}

const packageImage = new URL('../../pictures/function.png', import.meta.url).href;

export function AccommodationPlanner({ venueId, activeView = 'rates' }: AccommodationPlannerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { venues, packages, rooms, bookings } = useAppData();
  const accommodationVenues = useMemo(() => venues.slice(0, 3), [venues]);
  const requestedVenueId = venueId ?? searchParams.get('venueId') ?? '';
  const fallbackVenueId = accommodationVenues.some((item) => item.id === requestedVenueId)
    ? requestedVenueId
    : accommodationVenues[0]?.id ?? '';
  const initialPackageIndex = Math.min(Math.max(Number(searchParams.get('package') ?? 0) || 0, 0), Math.max(packages.length - 1, 0));

  const [selectedPackage, setSelectedPackage] = useState(initialPackageIndex);
  const [selectedVenueId, setSelectedVenueId] = useState(fallbackVenueId);
  const [guestCount, setGuestCount] = useState<number>(packages[initialPackageIndex]?.minGuests ?? 1);
  const [openInclusions, setOpenInclusions] = useState<number | null>(null);
  const [selectedRoomNames, setSelectedRoomNames] = useState<string[]>([]);
  const [checkIn, setCheckIn] = useState(toDateKey(new Date()));
  const [checkOut, setCheckOut] = useState(toDateKey(addDays(new Date(), 1)));
  const unavailable = useMemo(() => unavailableRooms(bookings, rooms.map((item) => item.name), checkIn, checkOut), [bookings, rooms, checkIn, checkOut]);
  const selectedRooms = rooms.filter((item) => selectedRoomNames.includes(item.name));
  const nightlyTotal = selectedRooms.reduce((sum, item) => sum + item.price, 0);
  const nights = Math.max(1, Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000));
  const canBookRooms = selectedRooms.length > 0 && checkOut > checkIn && checkIn >= toDateKey(new Date()) && !selectedRooms.some((item) => unavailable.has(item.name));
  const toggleRoom = (name: string) => {
    if (unavailable.has(name)) return;
    setSelectedRoomNames((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  };

  useEffect(() => {
    if ((!selectedVenueId || !accommodationVenues.some((item) => item.id === selectedVenueId)) && fallbackVenueId) {
      setSelectedVenueId(fallbackVenueId);
    }
  }, [accommodationVenues, fallbackVenueId, selectedVenueId]);

  useEffect(() => {
    const packageIndex = Math.min(Math.max(Number(searchParams.get('package') ?? 0) || 0, 0), Math.max(packages.length - 1, 0));
    setSelectedPackage(packageIndex);
    setGuestCount(packages[packageIndex]?.minGuests ?? 1);
  }, [packages, searchParams]);

  useEffect(() => {
    setSelectedRoomNames((current) => current.filter((name) => rooms.some((item) => item.name === name) && !unavailable.has(name)));
  }, [rooms, unavailable]);

  const venue = useMemo(
    () => accommodationVenues.find((item) => item.id === selectedVenueId) ?? accommodationVenues[0],
    [accommodationVenues, selectedVenueId],
  );
  const pkg = packages[selectedPackage] ?? packages[0];
  const total = pkg?.price ?? 0;
  const room = selectedRooms[0];

  return (
    <section id="rates" className="mx-auto max-w-6xl px-6 py-6">
      {activeView === 'rates' ? (
        <div className="grid items-start gap-7 lg:grid-cols-[2fr_0.95fr]">
          <div className="bg-white">
            <img src={packageImage} alt="Watikolo event package setup" className="h-[190px] w-full rounded-xl object-cover shadow-card" />

            <div className="mt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0f4da0]">Event Packages</p>
              <h2 className="mt-2 text-lg font-semibold text-[#202321]">Choose your ideal package</h2>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {packages.length > 0 ? packages.map((item, index) => {
              const selected = selectedPackage === index;

              return (
                <div
                  key={item.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setSelectedPackage(index);
                    setGuestCount(packages[index].minGuests);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      setSelectedPackage(index);
                      setGuestCount(packages[index].minGuests);
                    }
                  }}
                  className={`rounded-xl border p-3 ${selected ? 'border-[#0f4da0] bg-[#edf4ff]' : 'border-slate-200 bg-[#f8f8f8]'}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0f4da0]">Package {index + 1}</p>
                  <h3 className="mt-2 text-sm font-semibold text-[#202321]">{item.name}</h3>
                  <p className="text-base font-bold text-[#202321]">{formatCurrency(item.price)}</p>
                  <p className="mt-2 text-[11px] text-slate-500">{formatCapacityLabel(item.guestLabel)}</p>

                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedPackage(index);
                        setGuestCount(packages[index].minGuests);
                        setOpenInclusions((current) => (current === index ? null : index));
                      }}
                      onKeyDown={(event) => event.stopPropagation()}
                      className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600 transition hover:border-[#0f4da0] hover:text-[#0f4da0]"
                    >
                      Inclusions
                    </button>
                    {openInclusions === index ? (
                      <div className="mt-2 space-y-1.5 rounded-md border border-slate-200 bg-white px-2 py-2 text-[11px] font-medium text-[#202321] shadow-sm">
                        {item.inclusions.map((inclusion) => (
                          <div key={inclusion} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 shrink-0 text-[#0f4da0]" />
                            <span>{inclusion}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              );
              }) : (
                <p className="rounded-xl border border-slate-200 bg-[#f8f8f8] p-4 text-sm text-slate-500">No packages available.</p>
              )}
            </div>
          </div>

          <aside className="sticky top-24 h-fit rounded-xl border border-[#e9dfcc] bg-white p-4 shadow-lg shadow-slate-200/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0f4da0]">Booking Summary</p>
              <h2 className="mt-1 text-base font-semibold text-[#202321]">Your stay estimate</h2>
            </div>
            <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-[10px] font-semibold text-[#0f4da0]">Live</span>
          </div>

          <div className="mt-4 rounded-xl border border-[#ece2d0] bg-[#fcfbf8] p-3">
            <div className="flex items-center justify-between gap-3 border-b border-[#ece2d0] pb-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Venue</p>
                <p className="mt-1 text-sm font-semibold text-[#202321]">{venue?.name ?? 'Watikolo'}</p>
              </div>
              <span className="rounded-full bg-black px-3 py-1 text-[10px] font-semibold text-white">{formatCurrency(pkg?.price ?? 0)}</span>
            </div>

            <dl className="mt-3 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <dt>Selected package</dt>
                <dd className="font-medium text-[#202321]">{pkg?.name ?? 'No package'}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Guest count</dt>
                <dd className="font-medium text-[#202321]">{guestCount}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>Included guests</dt>
                <dd className="font-medium text-[#202321]">{pkg?.minGuests ?? 0}</dd>
              </div>
            </dl>
          </div>

          <div className="mt-4 rounded-xl bg-[#f7f7f7] p-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Package rate</span>
              <span className="font-medium text-[#202321]">{formatCurrency(pkg?.price ?? 0)}</span>
            </div>

            <div className="mt-4 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#202321]">Estimated total</span>
                <span className="text-lg font-bold text-[#0f4da0]">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Event date, event type, and final schedule are completed after you tap <strong>Book Now</strong>.
          </p>

          <div className="mt-4">
            <Button
              className="w-full"
              onClick={() => {
                const params = new URLSearchParams();
                if (!venue || !pkg) {
                  return;
                }
                params.set('venueId', venue.id);
                params.set('source', 'accommodation-planner');
                params.set('entrySource', 'planner');
                params.set('bookingMode', 'package');
                params.set('package', String(selectedPackage));
                params.set('packageName', pkg.name);
                params.set('packagePrice', String(pkg.price));
                params.set('includedGuests', String(pkg.minGuests));
                params.set('estimatedTotal', String(total));
                navigate(`/booking?${params.toString()}`);
              }}
            >
              Book Now
            </Button>
          </div>
          </aside>
        </div>
      ) : null}

      {activeView === 'rooms' ? (
        <div id="rooms" className="grid scroll-mt-24 items-start gap-7 lg:grid-cols-[2fr_0.95fr]">
          <div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#0f4da0]">Rooms</p>
              <h2 className="mt-2 text-lg font-semibold text-[#202321]">Choose one or more rooms</h2>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <label className="text-sm">Check-in<input type="date" min={toDateKey(new Date())} value={checkIn} onChange={(event) => { const value = event.target.value; if (!value) return; setCheckIn(value); if (checkOut <= value) setCheckOut(toDateKey(addDays(new Date(`${value}T00:00:00`), 1))); }} className="mt-1 block w-full rounded-lg border p-2" /></label>
                <label className="text-sm">Check-out<input type="date" min={toDateKey(addDays(new Date(`${checkIn}T00:00:00`), 1))} value={checkOut} onChange={(event) => { if (event.target.value) setCheckOut(event.target.value); }} className="mt-1 block w-full rounded-lg border p-2" /></label>
              </div>
              <p className="mt-2 text-xs text-slate-500">Availability is for your selected dates. Booked or reserved rooms cannot be selected.</p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {rooms.length > 0 ? rooms.map((roomItem) => {
                const selected = selectedRoomNames.includes(roomItem.name);
                const blocked = unavailable.has(roomItem.name);

                return (
                  <article
                    key={roomItem.name}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    aria-disabled={blocked}
                    onClick={() => toggleRoom(roomItem.name)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        toggleRoom(roomItem.name);
                      }
                    }}
                    className={`overflow-hidden rounded-xl border bg-white shadow-card transition ${blocked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} ${selected ? 'border-[#0f4da0] ring-2 ring-[#dbeafe]' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <img src={roomItem.image} alt={roomItem.name} className="h-40 w-full object-cover" />
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-[#202321]">{roomItem.name}</h3>
                      <p className={`mt-2 text-xs font-bold ${blocked ? 'text-red-700' : 'text-[#0f4da0]'}`} role="status">{blocked ? 'Not available — already booked or reserved for these dates' : selected ? 'Selected' : 'Available — click to select'}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatRoomCapacityLabel(roomItem.name, roomItem.capacity)}</p>
                      <p className="mt-2 text-base font-bold text-[#202321]">{formatCurrency(roomItem.price)}/night</p>
                      <div className="mt-3 space-y-1 text-[11px] text-slate-600">
                        {roomItem.inclusions.map((inclusion) => (
                          <div key={inclusion} className="flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 shrink-0 text-[#0f4da0]" />
                            <span>{inclusion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                );
              }) : (
                <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No rooms available.</p>
              )}
            </div>
          </div>

          <aside className="sticky top-24 h-fit rounded-xl border border-[#e9dfcc] bg-white p-4 shadow-lg shadow-slate-200/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#0f4da0]">Booking Summary</p>
                <h2 className="mt-1 text-base font-semibold text-[#202321]">Your room estimate</h2>
              </div>
              <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-[10px] font-semibold text-[#0f4da0]">Live</span>
            </div>

            <div className="mt-4 rounded-xl border border-[#ece2d0] bg-[#fcfbf8] p-3">
              <div className="border-b border-[#ece2d0] pb-3">
                <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">Selected rooms</p>
                {selectedRooms.length > 0 ? (
                  <ul className="mt-2 divide-y divide-[#ece2d0]">
                    {selectedRooms.map((item) => (
                      <li key={item.name} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#202321]">{item.name}</p>
                          <p className="mt-1 text-xs text-slate-500">{formatRoomCapacityLabel(item.name, item.capacity)}</p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-[#202321]">{formatCurrency(item.price)}/night</span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-2 text-sm text-slate-500">Select at least one room</p>}
              </div>

              <dl className="mt-3 space-y-2 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <dt>Selected rooms</dt>
                  <dd className="font-medium text-[#202321]">{selectedRooms.length}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Stay</dt>
                  <dd className="font-medium text-[#202321]">{nights} {nights === 1 ? 'night' : 'nights'}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-4 rounded-xl bg-[#f7f7f7] p-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Nightly rate</span>
                <span className="font-medium text-[#202321]">{formatCurrency(nightlyTotal)}/night</span>
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#202321]">Estimated total</span>
                  <span className="text-lg font-bold text-[#0f4da0]">{formatCurrency(nightlyTotal * nights)}</span>
                </div>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Your selected rooms and dates carry over to <strong>Book Now</strong>. Availability is checked again before submission.
            </p>

            <div className="mt-4">
              <Button
                className="w-full"
                disabled={!canBookRooms}
                onClick={() => {
                  const params = new URLSearchParams();
                  if (!venue || !room || !canBookRooms) {
                    return;
                  }
                  params.set('venueId', venue.id);
                  params.set('source', 'rooms');
                  selectedRooms.forEach((item) => params.append('room', item.name));
                  params.set('checkIn', checkIn);
                  params.set('checkOut', checkOut);
                  params.set('entrySource', 'rooms');
                  params.set('bookingMode', 'room');
                  params.set('packageName', room.name);
                  params.set('packagePrice', String(nightlyTotal));
                  params.set('estimatedTotal', String(nightlyTotal * nights));
                  navigate(`/booking?${params.toString()}`);
                }}
              >
                Book Now
              </Button>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
