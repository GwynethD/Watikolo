import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookingStepper } from '@/components/booking/BookingStepper';
import { PricingBreakdown } from '@/components/booking/PricingBreakdown';
import { TimeSlotPicker } from '@/components/booking/TimeSlotPicker';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField, TextAreaField } from '@/components/ui/FormField';
import { DEMO_CUSTOMER } from '@/constants/demo';
import { useAppData } from '@/context/AppDataContext';
import { baseTimeSlots } from '@/mock/timeSlots';
import type { BookingFormValues, EventType } from '@/types';
import { formatCurrency } from '@/utils/format';

const defaultForm: BookingFormValues = {
  venueId: 'venue-1',
  date: '2026-04-18',
  timeSlotId: 'slot-morning',
  eventType: 'Wedding',
  guests: 150,
  customerName: DEMO_CUSTOMER.name,
  customerEmail: DEMO_CUSTOMER.email,
  customerPhone: DEMO_CUSTOMER.phone,
  notes: 'Please include a clean bridal prep area and table layout assistance.',
};

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const presetVenueId = searchParams.get('venueId');
  const presetCheckIn = searchParams.get('checkIn');
  const navigate = useNavigate();
  const { venues, createBooking, getSlotStatus } = useAppData();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formValues, setFormValues] = useState<BookingFormValues>({
    ...defaultForm,
    venueId: presetVenueId ?? defaultForm.venueId,
    date: /^\\d{4}-\\d{2}-\\d{2}$/.test(presetCheckIn ?? '') ? (presetCheckIn as string) : defaultForm.date,
  });

  const selectedVenue = useMemo(
    () => venues.find((venue) => venue.id === formValues.venueId) ?? venues[0],
    [formValues.venueId, venues],
  );

  const availableSlots = useMemo(
    () =>
      baseTimeSlots.map((slot) => ({
        ...slot,
        status: getSlotStatus(formValues.venueId, formValues.date, slot.id),
      })),
    [formValues.date, formValues.venueId, getSlotStatus],
  );

  useEffect(() => {
    const selectedSlot = availableSlots.find((slot) => slot.id === formValues.timeSlotId);
    if (selectedSlot && selectedSlot.status !== 'booked') {
      return;
    }

    const nextSlot = availableSlots.find((slot) => slot.status !== 'booked') ?? availableSlots[0];
    setFormValues((current) => ({ ...current, timeSlotId: nextSlot.id }));
  }, [availableSlots, formValues.timeSlotId]);

  const selectedSlot = availableSlots.find((slot) => slot.id === formValues.timeSlotId) ?? availableSlots[0];
  const estimatedTotal = selectedVenue ? selectedVenue.price + 4500 + (formValues.guests > 150 ? 7000 : formValues.guests > 100 ? 3500 : 1500) : 0;

  const setField = <K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const eventTypeOptions: EventType[] = ['Wedding', 'Corporate', 'Birthday', 'Debut', 'Conference', 'Other'];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const booking = await createBooking(formValues);
      navigate('/booking/success', {
        state: {
          booking,
          total: booking.totalPrice,
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container-shell section-space">
      <div className="mb-8 overflow-hidden rounded-[2rem] shadow-soft">
        <div className="grid bg-white lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-8 sm:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#5fa7c9]">Booking escape</p>
            <h1 className="mt-4 font-display text-5xl font-semibold leading-none text-[#202321]">Plan your resort stay or private event in one guided flow.</h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              This public booking page now matches the brighter resort direction while still saving real demo bookings into the system.
            </p>
            <div className="mt-6">
              <BookingStepper currentStep={currentStep} />
            </div>
          </div>
          <img src={selectedVenue.heroImage} alt={selectedVenue.name} className="h-full min-h-[260px] w-full object-cover" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="panel border border-[#ece2d0] bg-[#fffdfa] p-6">
            <div className="grid gap-5 md:grid-cols-2">
              <SelectField
                label="Venue"
                value={formValues.venueId}
                onChange={(event) => setField('venueId', event.target.value)}
                options={venues.map((venue) => ({ label: venue.name, value: venue.id }))}
              />
              <SelectField
                label="Event type"
                value={formValues.eventType}
                onChange={(event) => setField('eventType', event.target.value as EventType)}
                options={eventTypeOptions.map((eventType) => ({ label: eventType, value: eventType }))}
              />
              <InputField label="Date" type="date" value={formValues.date} onChange={(event) => setField('date', event.target.value)} />
              <InputField
                label="Number of guests"
                type="number"
                min="1"
                value={String(formValues.guests)}
                onChange={(event) => setField('guests', Number(event.target.value))}
              />
            </div>
          </div>

          <div className="panel border border-[#ece2d0] bg-[#fffdfa] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-ink">Select available time slot</h2>
                <p className="mt-2 text-sm text-slate-500">Saved bookings automatically mark slots as reserved or booked for the selected venue and date.</p>
              </div>
              <span className="rounded-full bg-[#f8f3ea] px-4 py-2 text-sm text-slate-600">{formValues.date}</span>
            </div>
            <div className="mt-5">
              <TimeSlotPicker slots={availableSlots} selectedSlotId={formValues.timeSlotId} onSelect={(slotId) => setField('timeSlotId', slotId)} />
            </div>
          </div>

          <div className="panel border border-[#ece2d0] bg-[#fffdfa] p-6">
            <h2 className="text-2xl font-semibold text-ink">Guest details</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <InputField label="Full name" value={formValues.customerName} onChange={(event) => setField('customerName', event.target.value)} />
              <InputField label="Email address" type="email" value={formValues.customerEmail} onChange={(event) => setField('customerEmail', event.target.value)} />
              <InputField label="Phone number" value={formValues.customerPhone} onChange={(event) => setField('customerPhone', event.target.value)} />
              <div className="rounded-3xl bg-[#f8f3ea] p-4 text-sm text-slate-500">
                This booking will be persisted in local storage and routed through the admin approval workflow.
              </div>
              <div className="md:col-span-2">
                <TextAreaField label="Special instructions" value={formValues.notes} onChange={(event) => setField('notes', event.target.value)} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="ghost" onClick={() => setCurrentStep((step) => Math.max(0, step - 1))}>Previous</Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setCurrentStep((step) => Math.min(3, step + 1))}>Next step</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || selectedSlot.status === 'booked'}>
                {isSubmitting ? 'Saving booking...' : 'Confirm booking'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] border border-[#ece2d0] bg-[#fffdfa] shadow-card">
            <img src={selectedVenue.heroImage} alt={selectedVenue.name} className="h-56 w-full object-cover" />
            <div className="p-6">
              <p className="text-sm font-medium uppercase tracking-[0.12em] text-[#5fa7c9]">{selectedVenue.type}</p>
              <h2 className="mt-2 font-display text-4xl font-semibold leading-none text-[#202321]">{selectedVenue.name}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{selectedVenue.shortDescription}</p>
            </div>
          </div>

          <div className="panel border border-[#ece2d0] bg-[#fffdfa] p-6">
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Booking summary</p>
            <div className="mt-5 space-y-4 text-sm text-slate-600">
              <div className="flex items-center justify-between"><span>Venue</span><span className="font-medium text-ink">{selectedVenue.name}</span></div>
              <div className="flex items-center justify-between"><span>Date</span><span className="font-medium text-ink">{formValues.date}</span></div>
              <div className="flex items-center justify-between"><span>Time slot</span><span className="font-medium text-ink">{selectedSlot.label}</span></div>
              <div className="flex items-center justify-between"><span>Event type</span><span className="font-medium text-ink">{formValues.eventType}</span></div>
              <div className="flex items-center justify-between"><span>Guests</span><span className="font-medium text-ink">{formValues.guests}</span></div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-4"><span>Estimated total</span><span className="text-lg font-semibold text-ink">{formatCurrency(estimatedTotal)}</span></div>
            </div>
          </div>

          <PricingBreakdown basePrice={selectedVenue.price} guests={formValues.guests} />
        </div>
      </div>
    </div>
  );
}




