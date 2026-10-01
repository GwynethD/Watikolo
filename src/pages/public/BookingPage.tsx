import { ArrowLeft, ArrowRight, Check, FileText, Info, Landmark, Lightbulb, LockKeyhole, ShieldCheck, Smartphone, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { InputField, SelectField } from '@/components/ui/FormField';
import { DEMO_CUSTOMER } from '@/constants/demo';
import { useAppData } from '@/context/AppDataContext';
import { baseTimeSlots } from '@/mock/timeSlots';
import type { BookingFormValues, EventType } from '@/types';
import { formatCurrency, formatRoomCapacityLabel } from '@/utils/format';
import { cn } from '@/utils/cn';
import { unavailableRooms } from '@/utils/roomAvailability';

function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDaysKey(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNightsBetween(checkIn: string, checkOut: string) {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  const diffMs = end.getTime() - start.getTime();

  return Math.max(1, Math.ceil(diffMs / 86_400_000));
}

function toNonNegativeInteger(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.floor(value));
}

function parseCurrencyAmount(value: string) {
  const amount = Number(value.replace(/[^\d.]/g, ''));

  return Number.isFinite(amount) ? amount : 0;
}

function normalizeNameForMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function formatTimeLabel(value?: string) {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return '';
  }

  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function getRoomGuestRange(roomName?: string) {
  if (roomName?.includes('Grand Room')) {
    return { min: 1, max: 6, included: 3 };
  }

  if (roomName?.includes('Family Room')) {
    return { min: 1, max: 8, included: 4 };
  }

  return { min: 1, max: 4, included: 2 };
}

function isGoogleEmailAddress(email: string) {
  return /^[^\s@]+@(gmail\.com|googlemail\.com)$/i.test(email.trim());
}

const defaultForm: BookingFormValues = {
  venueId: 'venue-1',
  date: getTodayKey(),
  timeSlotId: 'slot-daytime',
  preferredStartTime: '08:00',
  eventType: 'Wedding',
  guests: 150,
  customerName: DEMO_CUSTOMER.name,
  customerEmail: DEMO_CUSTOMER.email,
  customerPhone: DEMO_CUSTOMER.phone,
  notes: '',
};

const steps = ['Confirmation & Extras', 'Guest Details', 'Payment'] as const;
const compactFieldClass = 'rounded-lg px-3 py-2 text-xs';
const extraGuestRates = {
  day: { label: 'Day Use', time: '9:00 AM - 5:00 PM', kids: 50, adults: 100 },
  night: { label: 'Night Use', time: '5:30 PM - 10:30 PM', kids: 60, adults: 120 },
} as const;
type ExtraGuestUse = keyof typeof extraGuestRates;
const roomInclusivePackageNames = new Set(['Deluxe', 'Grand', 'Ultimate']);

function splitCustomerName(name: string) {
  const [firstName = '', ...lastNameParts] = name.trim().split(/\s+/);
  return {
    firstName,
    lastName: lastNameParts.join(' '),
  };
}

export function BookingPage() {
  const [searchParams] = useSearchParams();
  const presetVenueId = searchParams.get('venueId');
  const presetCheckIn = searchParams.get('checkIn');
  const presetPackageName = searchParams.get('packageName');
  const presetPackagePrice = Number(searchParams.get('packagePrice') ?? 0);
  const presetIncludedGuests = Number(searchParams.get('includedGuests') ?? 0);
  const bookingMode = searchParams.get('bookingMode') === 'room' ? 'room' : 'package';
  const isRoomBooking = bookingMode === 'room';
  const todayKey = useMemo(() => getTodayKey(), []);
  const initialDate = /^\d{4}-\d{2}-\d{2}$/.test(presetCheckIn ?? '') && (presetCheckIn as string) >= todayKey ? (presetCheckIn as string) : todayKey;
  const navigate = useNavigate();
  const { bookings, venues, packages, rooms, addOns, createBooking, getSlotStatus } = useAppData();
  const bookingVenues = useMemo(() => venues.slice(0, 3), [venues]);
  const initialVenueId = bookingVenues.some((venue) => venue.id === presetVenueId) ? (presetVenueId as string) : defaultForm.venueId;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [showInlineInclusions, setShowInlineInclusions] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [extraGuestUse, setExtraGuestUse] = useState<ExtraGuestUse>('day');
  const [extraKidGuests, setExtraKidGuests] = useState(0);
  const [extraAdultGuests, setExtraAdultGuests] = useState(0);
  const [additionalHours, setAdditionalHours] = useState(0);
  const [roomExtraBeds, setRoomExtraBeds] = useState(0);
  const [guestName, setGuestName] = useState(() => splitCustomerName(defaultForm.customerName));
  const [paymentMethod, setPaymentMethod] = useState('Bank transfer');
  const [paymentProofName, setPaymentProofName] = useState('');
  const [paymentProofUrl, setPaymentProofUrl] = useState('');
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [bookingPolicyAccepted, setBookingPolicyAccepted] = useState(false);
  const [showBookingPolicyText, setShowBookingPolicyText] = useState(false);
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const value = searchParams.get('checkOut') ?? '';
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && value > initialDate ? value : addDaysKey(initialDate, 1);
  });
  const [formValues, setFormValues] = useState<BookingFormValues>({
    ...defaultForm,
    venueId: initialVenueId,
    date: initialDate,
    guests: presetIncludedGuests || defaultForm.guests,
  });

  useEffect(() => {
    if (bookingVenues.length > 0 && !bookingVenues.some((venue) => venue.id === formValues.venueId)) {
      setFormValues((current) => ({ ...current, venueId: bookingVenues[0].id }));
    }
  }, [bookingVenues, formValues.venueId]);

  const selectedVenue = useMemo(
    () => bookingVenues.find((venue) => venue.id === formValues.venueId) ?? bookingVenues[0],
    [bookingVenues, formValues.venueId],
  );
  const eventTypeOptions: EventType[] = ['Wedding', 'Corporate', 'Birthday', 'Debut', 'Conference', 'Other'];
  const requestedRoomNames = searchParams.getAll('room');
  const chosenRooms = rooms.filter((room) => (requestedRoomNames.length ? requestedRoomNames : [presetPackageName]).includes(room.name));
  const packageLabel = (isRoomBooking ? chosenRooms.map((room) => room.name).join(', ') : '') || presetPackageName || selectedVenue.name || (isRoomBooking ? 'Watikolo Room' : 'Main Villa');
  const selectedAccommodation = isRoomBooking
    ? chosenRooms[0]
    : packages.find((pkg) => pkg.name === presetPackageName);
  const selectedRoomGuestRange = useMemo(() => isRoomBooking
    ? rooms.filter((room) => (searchParams.getAll('room').length ? searchParams.getAll('room') : [presetPackageName]).includes(room.name)).reduce((sum, room) => {
        const range = getRoomGuestRange(room.name);
        return { min: 1, max: sum.max + range.max, included: sum.included + range.included };
      }, { min: 1, max: 0, included: 0 })
    : getRoomGuestRange(), [isRoomBooking, rooms, searchParams, presetPackageName]);
  const includedGuests = (isRoomBooking ? selectedRoomGuestRange.included : presetIncludedGuests) || (
    isRoomBooking
      ? selectedRoomGuestRange.included
      : selectedAccommodation && 'minGuests' in selectedAccommodation ? selectedAccommodation.minGuests : 1
  );
  const baseEstimate = isRoomBooking ? chosenRooms.reduce((sum, room) => sum + room.price, 0) : selectedAccommodation?.price ?? (presetPackagePrice || selectedVenue.price);
  const roomNights = isRoomBooking ? getNightsBetween(formValues.date, checkOutDate) : 1;
  const roomStayTotal = isRoomBooking ? baseEstimate * roomNights : baseEstimate;
  const packageIndex = Number(searchParams.get('package') ?? (isRoomBooking ? -1 : 0));
  const requiresWholeProperty = !isRoomBooking && (packageIndex >= 3 || roomInclusivePackageNames.has(presetPackageName ?? ''));
  const hasFreeExtraGuests = requiresWholeProperty;

  const availableSlots = useMemo(
    () =>
      baseTimeSlots.map((slot) => ({
        ...slot,
        status: getSlotStatus(formValues.venueId, formValues.date, slot.id, requiresWholeProperty),
      })),
    [formValues.date, formValues.venueId, getSlotStatus, requiresWholeProperty],
  );

  useEffect(() => {
    const selectedSlot = availableSlots.find((slot) => slot.id === formValues.timeSlotId);
    if (selectedSlot && selectedSlot.status === 'available') {
      return;
    }

    const nextSlot = availableSlots.find((slot) => slot.status === 'available') ?? availableSlots[0];
    setFormValues((current) => ({ ...current, timeSlotId: nextSlot.id }));
  }, [availableSlots, formValues.timeSlotId]);

  const selectedSlot = availableSlots.find((slot) => slot.id === formValues.timeSlotId) ?? availableSlots[0];
  const preferredStartTime = formValues.preferredStartTime || selectedSlot?.start || '08:00';
  const venueOptions = useMemo(
    () =>
      bookingVenues.map((venue) => {
        const venueSlots = baseTimeSlots.map((slot) => getSlotStatus(venue.id, formValues.date, slot.id, requiresWholeProperty));
        const hasAvailableSlot = venueSlots.some((status) => status === 'available');

        return {
          label: `${venue.name}${hasAvailableSlot ? '' : ' - Unavailable'}`,
          value: venue.id,
          disabled: !hasAvailableSlot,
        };
      }),
    [bookingVenues, formValues.date, getSlotStatus, requiresWholeProperty],
  );
  const canAddAddOns = !isRoomBooking && packageIndex >= 0 && packageIndex <= 2;
  const canAddRooms = !isRoomBooking && packageIndex >= 0 && packageIndex <= 2;
  const unavailableRoomNames = useMemo(
    () =>
      new Set(
        rooms
          .filter((room) =>
            bookings.some((booking) => {
              const requestedDates = Array.from(
                { length: isRoomBooking ? roomNights : 1 },
                (_, index) => addDaysKey(formValues.date, index),
              );
              const bookingCheckOut = booking.notes?.match(/check-out\s+(\d{4}-\d{2}-\d{2})/i)?.[1];
              const bookingDates = booking.bookingMode === 'room' && bookingCheckOut
                ? requestedDates.filter((date) => date >= booking.date && date < bookingCheckOut)
                : requestedDates.filter((date) => date === booking.date);
              const roomInclusivePackage = booking.bookingMode === 'package' && (
                (typeof booking.packageIndex === 'number' && booking.packageIndex >= 3) ||
                roomInclusivePackageNames.has(booking.packageName ?? '')
              );

              return (
                bookingDates.length > 0 &&
                booking.status !== 'cancelled' &&
                booking.status !== 'rejected' &&
                (
                  roomInclusivePackage ||
                  (booking.bookingMode === 'room' && booking.packageName === room.name) ||
                  booking.roomAddOns?.includes(room.name) ||
                  booking.notes?.includes(`${room.name} Room Add-on`)
                )
              );
            }),
          )
          .map((room) => room.name),
      ),
    [bookings, formValues.date, isRoomBooking, roomNights, rooms],
  );
  const unavailableRoomAddOns = useMemo(
    () =>
      new Set(
        [...unavailableRoomNames].map((roomName) => `${roomName} Room Add-on`),
      ),
    [unavailableRoomNames],
  );
  const blockedStayRooms = unavailableRooms(bookings, rooms.map((room) => room.name), formValues.date, checkOutDate);
  const selectedRoomUnavailable = isRoomBooking && (chosenRooms.length === 0 || chosenRooms.some((room) => blockedStayRooms.has(room.name)) || requestedRoomNames.some((name) => !rooms.some((room) => room.name === name)));
  const availableAddOns = useMemo(
    () => isRoomBooking || !canAddAddOns
      ? []
      : [
          ...addOns.map((addOn) => ({ ...addOn, type: 'service' as const })),
          ...(canAddRooms
            ? rooms.map((room) => ({
                name: `${room.name} Room Add-on`,
                price: room.price,
                description: formatRoomCapacityLabel(room.name, room.capacity),
                type: 'room' as const,
                image: room.image,
                unavailable: unavailableRoomAddOns.has(`${room.name} Room Add-on`),
              }))
            : []),
        ],
    [addOns, canAddAddOns, canAddRooms, isRoomBooking, rooms, unavailableRoomAddOns],
  );
  const selectedAddOnDetails = availableAddOns.filter((addOn) => selectedAddOns.includes(addOn.name) && !('unavailable' in addOn && addOn.unavailable));
  const selectedRoomAddOns = selectedAddOnDetails
    .filter((addOn) => addOn.type === 'room')
    .map((addOn) => addOn.name.replace(/ Room Add-on$/, ''));
  const addOnsTotal = selectedAddOnDetails.reduce((sum, addOn) => sum + addOn.price, 0);
  const selectedExtraGuestRates = extraGuestRates[extraGuestUse];
  const chargedExtraKidGuests = extraKidGuests;
  const chargedExtraAdultGuests = extraAdultGuests;
  const extraGuestAssignedCount = isRoomBooking ? Math.max(0, formValues.guests - includedGuests) : chargedExtraKidGuests + chargedExtraAdultGuests;
  const extraGuestCount = extraGuestAssignedCount;
  const totalGuestCount = isRoomBooking ? formValues.guests : includedGuests + extraGuestCount;
  const extraKidGuestTotal = !isRoomBooking && hasFreeExtraGuests ? 0 : chargedExtraKidGuests * selectedExtraGuestRates.kids;
  const extraAdultGuestTotal = !isRoomBooking && hasFreeExtraGuests ? 0 : chargedExtraAdultGuests * selectedExtraGuestRates.adults;
  const roomExtraBedTotal = isRoomBooking ? roomExtraBeds * 250 : 0;
  const extraGuestTotal = isRoomBooking ? roomExtraBedTotal : extraKidGuestTotal + extraAdultGuestTotal;
  const additionalHoursTotal = isRoomBooking ? 0 : additionalHours * 1000;
  const estimatedTotal = roomStayTotal + addOnsTotal + extraGuestTotal + additionalHoursTotal;
  const requiredDownPayment = estimatedTotal * 0.3;
  const paidAmount = parseCurrencyAmount(paymentAmount);
  const paymentMeetsMinimum = paidAmount >= requiredDownPayment;
  const packageInclusions = selectedAccommodation?.inclusions ?? ['Pool access', 'Tables and chairs', 'Basic styling support'];
  const customerEmailIsGoogle = isGoogleEmailAddress(formValues.customerEmail);
  const normalizedGuestName = normalizeNameForMatch(formValues.customerName);
  const duplicateCustomerBooking = bookings.find((booking) => {
    const isActiveBooking = booking.status === 'pending' || booking.status === 'approved';

    return Boolean(normalizedGuestName) && isActiveBooking && normalizeNameForMatch(booking.customerName) === normalizedGuestName;
  });
  const guestDetailsComplete = Boolean(
    guestName.firstName.trim() &&
    customerEmailIsGoogle &&
    formValues.customerPhone.trim() &&
    !duplicateCustomerBooking,
  );
  const paymentComplete = Boolean(paymentMethod && paymentProofName && paymentProofUrl && paymentReferenceNumber.trim() && paymentMeetsMinimum && bookingPolicyAccepted);
  const nextDisabled = selectedRoomUnavailable || (!isRoomBooking && selectedSlot.status !== 'available') || (currentStep === 1 && !guestDetailsComplete) || (currentStep === 2 && !paymentComplete);

  useEffect(() => {
    setSelectedAddOns((current) => current.filter((name) => availableAddOns.some((addOn) => addOn.name === name && !('unavailable' in addOn && addOn.unavailable))));
  }, [availableAddOns]);

  useEffect(() => {
    if (isRoomBooking) {
      return;
    }

    if (formValues.guests !== totalGuestCount) {
      setFormValues((current) => ({ ...current, guests: totalGuestCount }));
    }
  }, [formValues.guests, isRoomBooking, totalGuestCount]);

  useEffect(() => {
    if (!isRoomBooking) {
      return;
    }

    const nextGuestCount = Math.min(Math.max(formValues.guests, selectedRoomGuestRange.min), selectedRoomGuestRange.max);
    if (formValues.guests !== nextGuestCount) {
      setFormValues((current) => ({ ...current, guests: nextGuestCount }));
    }
  }, [formValues.guests, isRoomBooking, selectedRoomGuestRange]);

  const setField = <K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) => {
    if (field === 'date' && typeof value === 'string' && value < todayKey) {
      setFormValues((current) => ({ ...current, date: todayKey }));
      return;
    }

    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const setCheckInDate = (date: string) => {
    const nextCheckIn = date < todayKey ? todayKey : date;
    setField('date', nextCheckIn);
    setCheckOutDate((current) => current <= nextCheckIn ? addDaysKey(nextCheckIn, 1) : current);
  };

  const setRoomGuestCount = (guestCount: number) => {
    const nextGuestCount = Math.min(Math.max(guestCount, selectedRoomGuestRange.min), selectedRoomGuestRange.max);
    setField('guests', nextGuestCount);
  };

  const toggleAddOn = (name: string) => {
    const addOn = availableAddOns.find((item) => item.name === name);

    if (addOn && 'unavailable' in addOn && addOn.unavailable) {
      return;
    }

    setSelectedAddOns((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  };

  const setGuestNameField = (field: 'firstName' | 'lastName', value: string) => {
    setGuestName((current) => {
      const next = { ...current, [field]: value };
      setFormValues((form) => ({ ...form, customerName: `${next.firstName} ${next.lastName}`.trim() }));
      return next;
    });
  };

  const handlePaymentProofChange = (file?: File) => {
    if (!file) {
      setPaymentProofName('');
      setPaymentProofUrl('');
      return;
    }

    setPaymentProofName(file.name);
    const reader = new FileReader();
    reader.onload = () => setPaymentProofUrl(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => setPaymentProofUrl('');
    reader.readAsDataURL(file);
  };

  const handleNext = async () => {
    setSubmissionError('');

    if (selectedRoomUnavailable) {
      return;
    }

    if (!isRoomBooking && selectedSlot.status !== 'available') {
      return;
    }

    if (currentStep === 1 && !guestDetailsComplete) {
      if (duplicateCustomerBooking) {
        setSubmissionError('This guest name already has an active booking request.');
      }
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((step) => step + 1);
      return;
    }

    if (formValues.date < todayKey) {
      setField('date', todayKey);
      return;
    }

    if (!paymentMeetsMinimum) {
      setSubmissionError(`Minimum down payment is ${formatCurrency(requiredDownPayment)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const addOnNote = selectedAddOnDetails.length > 0
        ? `Selected add-ons: ${selectedAddOnDetails.map((addOn) => addOn.name).join(', ')}.`
        : '';
      const extraGuestNote = extraGuestTotal > 0
        ? isRoomBooking
          ? `Extra bed fee: ${roomExtraBeds} bed(s) at ${formatCurrency(250)} each.`
          : `Extra guest fee: ${chargedExtraKidGuests} kid(s) at ${formatCurrency(selectedExtraGuestRates.kids)} each and ${chargedExtraAdultGuests} adult(s) at ${formatCurrency(selectedExtraGuestRates.adults)} each (${selectedExtraGuestRates.label}).`
        : hasFreeExtraGuests && extraGuestCount > 0
          ? `Extra guest fee waived for ${packageLabel}: ${chargedExtraKidGuests} kid(s) and ${chargedExtraAdultGuests} adult(s).`
        : '';
      const roomDateNote = isRoomBooking ? `Room stay: check-in ${formValues.date} at 2:00 PM, check-out ${checkOutDate} at 12:00 NN. Number of nights: ${roomNights}.` : '';
      const roomGuestNote = isRoomBooking ? `Guests checked in: ${formValues.guests}. Included occupancy: ${includedGuests}. Extra bed: ${roomExtraBeds > 0 ? `${roomExtraBeds} selected` : 'not selected'}.` : '';
      const preferredStartTimeNote = !isRoomBooking && preferredStartTime
        ? `Preferred start time: ${formatTimeLabel(preferredStartTime)}.`
        : '';
      const additionalHoursNote = !isRoomBooking && additionalHours > 0
        ? `Additional hours: ${additionalHours} hour(s) at ${formatCurrency(1000)} per hour.`
        : '';
      const paymentNote = `Payment method: ${paymentMethod}. Payment reference number: ${paymentReferenceNumber.trim()}. Amount paid: ${formatCurrency(paidAmount)}. Payment proof screenshot: ${paymentProofName}. Booking policy accepted.`;
      const booking = await createBooking({
        ...formValues,
        preferredStartTime: isRoomBooking ? undefined : preferredStartTime,
        bookingMode,
        packageName: isRoomBooking ? chosenRooms[0]?.name : packageLabel,
        packageIndex,
        roomAddOns: isRoomBooking ? chosenRooms.map((room) => room.name) : selectedRoomAddOns,
        notes: [formValues.notes, addOnNote, extraGuestNote, preferredStartTimeNote, additionalHoursNote, roomDateNote, roomGuestNote, paymentNote].filter(Boolean).join('\n'),
        totalPrice: estimatedTotal,
        depositAmount: paidAmount,
        paymentReferenceNumber: paymentReferenceNumber.trim(),
        bookingPolicyAccepted,
        paymentProofName,
        paymentProofUrl,
      });
      navigate('/booking/success', {
        state: {
          booking,
          total: estimatedTotal,
        },
      });
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Unable to submit booking. Please try another schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white font-body">
      <div className="mx-auto max-w-[980px] px-3 pb-36 pt-4 sm:px-4 lg:pb-8">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-[#071224]">Complete your booking</h1>
          <p className="mt-1 text-xs text-slate-500">
            Review your {isRoomBooking ? 'room' : 'package'}, add your details, then submit the request for admin approval.
          </p>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
          {steps.map((step, index) => (
            <div key={step} className="flex flex-1 items-center gap-2 last:flex-none">
              <div
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold',
                  index <= currentStep ? 'border-[#0071d9] text-[#0071d9]' : 'border-slate-300 text-slate-400',
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide',
                  index <= currentStep ? 'text-[#0071d9]' : 'text-slate-400',
                )}
              >
                {step}
              </span>
              {index < steps.length - 1 ? <div className="hidden h-px flex-1 bg-slate-200 md:block" /> : null}
            </div>
          ))}
        </div>

        <div className="mt-4 grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="rounded-lg bg-[#f4f4f7] p-3">
            {currentStep === 0 ? (
              <div>
                <h2 className="text-lg font-bold text-[#071224]">Confirmation & extras</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Choose the {isRoomBooking ? 'room stay details' : 'event details'} that work best for your visit.
                </p>

                <div className="mt-3 space-y-3">
                  <div className="rounded-md bg-white p-3">
                    <h3 className="text-base font-bold text-[#071224]">1 x {packageLabel}</h3>
                    <div className="mt-2 space-y-2 text-sm text-[#071224]">
                      <p className="flex items-center gap-2 text-[#009a4d]">
                        <Check className="h-4 w-4" />
                        {isRoomBooking ? 'Room Inclusions' : 'Package Inclusions'}
                        <button
                          type="button"
                          onClick={() => setShowInlineInclusions((current) => !current)}
                          className="rounded-full text-slate-400 transition hover:text-[#0f4da0]"
                          aria-label={`View ${isRoomBooking ? 'room' : 'package'} inclusions`}
                        >
                          <Info className="h-4 w-4" />
                        </button>
                      </p>
                      {showInlineInclusions ? (
                        <div className="ml-6 space-y-1.5 rounded-md border border-slate-100 bg-[#f8fafc] px-3 py-2 text-xs text-slate-600">
                          {packageInclusions.map((inclusion) => (
                            <div key={inclusion} className="flex items-center gap-2">
                              <Check className="h-3.5 w-3.5 shrink-0 text-[#009a4d]" />
                              <span>{inclusion}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-col items-start gap-1 border-t border-slate-100 pt-3 sm:items-end sm:text-right">
                      <p className="text-lg font-bold text-[#071224]">{formatCurrency(isRoomBooking ? roomStayTotal : baseEstimate)}</p>
                      <p className="text-xs text-slate-500">
                        {isRoomBooking
                          ? `${formatCurrency(baseEstimate)} x ${roomNights} night${roomNights === 1 ? '' : 's'}`
                          : `${includedGuests} guest${includedGuests === 1 ? '' : 's'} included in price`}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 rounded-md bg-white p-3 sm:grid-cols-2">
                    {isRoomBooking ? (
                      <>
                        <InputField
                          label="Check-in"
                          type="date"
                          min={todayKey}
                          value={formValues.date}
                          className={compactFieldClass}
                          onChange={(event) => setCheckInDate(event.target.value)}
                        />
                        <InputField
                          label="Check-out"
                          type="date"
                          min={addDaysKey(formValues.date, 1)}
                          value={checkOutDate}
                          className={compactFieldClass}
                          onChange={(event) => setCheckOutDate(event.target.value <= formValues.date ? addDaysKey(formValues.date, 1) : event.target.value)}
                        />
                        <div className="flex flex-col gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
                          <span>Guests</span>
                          <div className="flex h-9 items-center justify-between rounded-lg border border-slate-200 bg-white px-2">
                            <button
                              type="button"
                              onClick={() => setRoomGuestCount(formValues.guests - 1)}
                              disabled={formValues.guests <= selectedRoomGuestRange.min}
                              className="grid h-7 w-7 place-items-center rounded-full bg-slate-100 text-base font-bold text-[#071224] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              -
                            </button>
                            <span className="text-base font-bold text-[#071224]">{formValues.guests}</span>
                            <button
                              type="button"
                              onClick={() => setRoomGuestCount(formValues.guests + 1)}
                              disabled={formValues.guests >= selectedRoomGuestRange.max}
                              className="grid h-7 w-7 place-items-center rounded-full bg-[#0f4da0] text-base font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs text-slate-500">
                            Included occupancy: {includedGuests}. Maximum guests: {selectedRoomGuestRange.max}.
                          </span>
                        </div>
                        {selectedRoomUnavailable ? (
                          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 sm:col-span-2">
                            One or more selected rooms are not available for these dates. Change your dates or return to Rooms to choose another room.
                          </p>
                        ) : null}
                        <div className="rounded-md border border-[#dbeafe] bg-[#f8fbff] p-3 text-xs text-slate-600 sm:col-span-2">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-semibold text-[#071224]">Extra bed</p>
                            <span className="font-semibold text-[#0f4da0]">{formatCurrency(250)} each</span>
                          </div>
                          <label className="mt-2 block rounded-md bg-white px-3 py-2">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Extra beds</span>
                            <input
                              type="number"
                              min="0"
                              value={roomExtraBeds}
                              onChange={(event) => setRoomExtraBeds(toNonNegativeInteger(Number(event.target.value)))}
                              className="mt-1 h-8 w-full rounded-md border border-slate-200 px-2 text-sm font-semibold text-[#071224] outline-none focus:border-[#0f4da0] focus:ring-2 focus:ring-[#dbeafe]"
                            />
                            <span className="mt-1 block text-slate-500">
                              {roomExtraBeds > 0 ? `${roomExtraBeds} x ${formatCurrency(250)} = ${formatCurrency(roomExtraBedTotal)}` : 'Not added'}
                            </span>
                          </label>
                        </div>
                      </>
                    ) : (
                      <>
                        <SelectField
                          label="Venue"
                          value={formValues.venueId}
                          className={compactFieldClass}
                          onChange={(event) => setField('venueId', event.target.value)}
                          options={venueOptions}
                        />
                        <SelectField
                          label="Event type"
                          value={formValues.eventType}
                          className={compactFieldClass}
                          onChange={(event) => setField('eventType', event.target.value as EventType)}
                          options={eventTypeOptions.map((eventType) => ({ label: eventType, value: eventType }))}
                        />
                        <InputField label="Date" type="date" min={todayKey} value={formValues.date} className={compactFieldClass} onChange={(event) => setField('date', event.target.value)} />
                        <SelectField
                          label="Time slot"
                          value={formValues.timeSlotId}
                          className={compactFieldClass}
                          onChange={(event) => {
                            const nextSlot = availableSlots.find((slot) => slot.id === event.target.value);
                            setFormValues((current) => ({
                              ...current,
                              timeSlotId: event.target.value,
                              preferredStartTime: nextSlot?.start ?? current.preferredStartTime,
                            }));
                          }}
                          options={availableSlots.map((slot) => ({
                            label: `${slot.label}${slot.status !== 'available' ? ` - ${slot.status === 'reserved' ? 'Reserved' : 'Booked'}` : ''}`,
                            value: slot.id,
                            disabled: slot.status !== 'available',
                          }))}
                        />
                        <InputField
                          label="Preferred start time"
                          type="time"
                          min={selectedSlot?.start}
                          max={selectedSlot?.end}
                          value={preferredStartTime}
                          className={compactFieldClass}
                          onChange={(event) => setField('preferredStartTime', event.target.value)}
                          hint={`Within ${selectedSlot?.label ?? 'selected slot'}`}
                        />
                        {selectedSlot.status !== 'available' ? (
                          <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 sm:col-span-2">
                            This time slot is unavailable for the selected venue and date.
                          </p>
                        ) : null}
                      </>
                    )}
                    {!isRoomBooking ? (
                      <div className="rounded-md border border-[#dbeafe] bg-[#f8fbff] p-3 text-xs text-slate-600 sm:col-span-2">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-semibold text-[#071224]">Extra guest entrance fee</p>
                      </div>
                      <div className="mt-2 rounded-md bg-white px-3 py-2 font-medium text-[#071224]">
                        Included guests: {includedGuests}. Extra guests: {extraGuestCount}. Total guests: {totalGuestCount}.
                      </div>
                      {hasFreeExtraGuests ? (
                        <p className="mt-2 rounded-md bg-emerald-50 px-3 py-2 text-[11px] font-semibold text-emerald-700">
                          Extra guest fee is free for this package.
                        </p>
                      ) : null}
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {(['day', 'night'] as ExtraGuestUse[]).map((use) => {
                          const rate = extraGuestRates[use];
                          const selected = extraGuestUse === use;

                          return (
                            <button
                              key={use}
                              type="button"
                              onClick={() => setExtraGuestUse(use)}
                              className={cn(
                                'rounded-md border bg-white px-3 py-2 text-left transition',
                                selected ? 'border-[#0f4da0] ring-2 ring-[#dbeafe]' : 'border-slate-200 hover:border-[#0f4da0]',
                              )}
                            >
                              <span className="font-semibold text-[#0f4da0]">{rate.label}</span>
                              <span className="mt-1 block text-slate-500">{rate.time}</span>
                              <span className="mt-1 block font-medium text-[#071224]">
                                Kids {formatCurrency(rate.kids)} / Adult {formatCurrency(rate.adults)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <label className="rounded-md bg-white px-3 py-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Extra kids</span>
                          <input
                            type="number"
                            min="0"
                            value={extraKidGuests}
                            onChange={(event) => setExtraKidGuests(toNonNegativeInteger(Number(event.target.value)))}
                            className="mt-1 h-8 w-full rounded-md border border-slate-200 px-2 text-sm font-semibold text-[#071224] outline-none focus:border-[#0f4da0] focus:ring-2 focus:ring-[#dbeafe]"
                          />
                          <span className="mt-1 block text-slate-500">{formatCurrency(extraKidGuestTotal)}</span>
                        </label>
                        <label className="rounded-md bg-white px-3 py-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">Extra adults</span>
                          <input
                            type="number"
                            min="0"
                            value={extraAdultGuests}
                            onChange={(event) => setExtraAdultGuests(toNonNegativeInteger(Number(event.target.value)))}
                            className="mt-1 h-8 w-full rounded-md border border-slate-200 px-2 text-sm font-semibold text-[#071224] outline-none focus:border-[#0f4da0] focus:ring-2 focus:ring-[#dbeafe]"
                          />
                          <span className="mt-1 block text-slate-500">{formatCurrency(extraAdultGuestTotal)}</span>
                        </label>
                      </div>
                      <div className="mt-3 rounded-md bg-white px-3 py-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-semibold text-[#071224]">Additional Hours</span>
                          <span className="font-semibold text-[#0f4da0]">{formatCurrency(1000)} per hour</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          value={additionalHours}
                          onChange={(event) => setAdditionalHours(toNonNegativeInteger(Number(event.target.value)))}
                          className="mt-2 h-8 w-full rounded-md border border-slate-200 px-2 text-sm font-semibold text-[#071224] outline-none focus:border-[#0f4da0] focus:ring-2 focus:ring-[#dbeafe]"
                        />
                        <span className="mt-1 block text-slate-500">{formatCurrency(additionalHoursTotal)}</span>
                      </div>
                      </div>
                    ) : null}
                  </div>

                  {canAddAddOns ? (
                    <div className="rounded-md bg-white p-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f4da0]">Additional add-ons</p>
                          <h3 className="mt-1 text-base font-bold text-[#071224]">Customize your booking</h3>
                        </div>
                        <span className="text-sm font-semibold text-[#0f4da0]">{formatCurrency(addOnsTotal)} selected</span>
                      </div>

                      <div className="mt-2 grid gap-2 md:grid-cols-2">
                        {availableAddOns.map((addOn) => {
                          const selected = selectedAddOns.includes(addOn.name);
                          const image = 'image' in addOn ? addOn.image : null;
                          const unavailable = 'unavailable' in addOn && addOn.unavailable;

                          return (
                            <button
                              key={addOn.name}
                              type="button"
                              onClick={() => unavailable ? undefined : toggleAddOn(addOn.name)}
                              disabled={unavailable}
                              className={cn(
                                'rounded-lg border p-2.5 text-left transition',
                                unavailable
                                  ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                                  : selected
                                    ? 'border-[#0f4da0] bg-[#edf4ff]'
                                    : 'border-slate-200 bg-white hover:border-slate-300',
                              )}
                            >
                              {image ? <img src={image} alt={addOn.name} className="mb-2 h-16 w-full rounded-md object-cover" /> : null}
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-bold text-[#071224]">{addOn.name}</p>
                                    <span className="rounded-full bg-[#f3efe6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                      {unavailable ? 'Unavailable' : addOn.type === 'room' ? 'Room' : 'Add-on'}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs leading-4 text-slate-500">
                                    {unavailable ? 'Already booked for this date' : addOn.description}
                                  </p>
                                </div>
                                <span className="shrink-0 text-xs font-bold text-[#0f4da0]">
                                  {formatCurrency(addOn.price)}{addOn.type === 'room' ? '/night' : ''}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                </div>
              </div>
            ) : null}

            {currentStep === 1 ? (
              <div>
                <h2 className="text-lg font-bold text-[#071224]">Guest details</h2>
                <p className="mt-1 text-xs text-slate-500">Tell us who the booking is for so we can contact you about approval and next steps.</p>
                <div className="mt-3 grid gap-2 rounded-md bg-white p-3 md:grid-cols-2">
                  <InputField
                    label="First name *"
                    placeholder="First name"
                    value={guestName.firstName}
                    className={compactFieldClass}
                    onChange={(event) => setGuestNameField('firstName', event.target.value)}
                  />
                  <InputField
                    label="Last name"
                    placeholder="Last name"
                    value={guestName.lastName}
                    className={compactFieldClass}
                    onChange={(event) => setGuestNameField('lastName', event.target.value)}
                  />
                  <InputField label="Contact phone" value={formValues.customerPhone} className={compactFieldClass} onChange={(event) => setField('customerPhone', event.target.value)} />
                  <InputField
                    label="Email"
                    type="email"
                    value={formValues.customerEmail}
                    className={compactFieldClass}
                    onChange={(event) => setField('customerEmail', event.target.value)}
                    hint="Use a Gmail or Googlemail address."
                  />
                  {duplicateCustomerBooking ? (
                    <p className="rounded-md bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 md:col-span-2">
                      This guest name already has an active booking request ({duplicateCustomerBooking.reference}). Please contact Watikolo if this is yours.
                    </p>
                  ) : null}
                  {!guestDetailsComplete && !duplicateCustomerBooking ? (
                    <p className="rounded-md bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 md:col-span-2">
                      Please complete your first name, phone number, and a Gmail or Googlemail address before continuing.
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div>
                <h2 className="text-lg font-bold text-[#071224]">Payment</h2>
                <p className="mt-1 text-xs text-slate-500">Choose a payment option, upload your screenshot, then submit your booking request.</p>

                <div className="mt-3 space-y-3">
                  <div className="rounded-md bg-white p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#0f4da0]">Payment option</p>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('Bank transfer')}
                      className={cn(
                        'mt-2 flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition',
                        paymentMethod === 'Bank transfer' ? 'border-[#0f4da0] bg-[#edf4ff]' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0f4da0]">
                        <Landmark className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-[#071224]">Bank transfer</span>
                        <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                          Send your payment to Watikolo's bank account, then upload the screenshot below for admin verification.
                        </span>
                      </span>
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#0f4da0]">
                        {paymentMethod === 'Bank transfer' ? <span className="h-2.5 w-2.5 rounded-full bg-[#0f4da0]" /> : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('GCash')}
                      className={cn(
                        'mt-2 flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition',
                        paymentMethod === 'GCash' ? 'border-[#0f4da0] bg-[#edf4ff]' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#0f4da0]">
                        <Smartphone className="h-4 w-4" />
                      </span>
                      <span className="flex-1">
                        <span className="block text-sm font-bold text-[#071224]">GCash</span>
                        <span className="mt-0.5 block text-xs leading-4 text-slate-500">
                          Pay through GCash, then upload the receipt screenshot below for admin verification.
                        </span>
                      </span>
                      <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-[#0f4da0]">
                        {paymentMethod === 'GCash' ? <span className="h-2.5 w-2.5 rounded-full bg-[#0f4da0]" /> : null}
                      </span>
                    </button>
                    {paymentMethod === 'GCash' ? (
                      <div className="mt-2 rounded-lg border border-slate-100 bg-[#fbfcfe] p-2.5 text-xs text-slate-600">
                        <p className="font-bold text-[#071224]">GCash payment</p>
                        <p className="mt-1 leading-4">Use the verified Watikolo contact number for GCash payment, then upload your receipt screenshot.</p>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {['09938860922'].map((number) => (
                            <div key={number} className="rounded-lg bg-white p-2.5">
                              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">Account name</p>
                              <p className="mt-1 font-bold text-[#071224]">Theresa Garnet Ibale</p>
                              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-400">GCash number</p>
                              <p className="mt-1 font-bold text-[#071224]">{number}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    {paymentMethod === 'Bank transfer' ? (
                    <div className="mt-2 rounded-lg border border-slate-100 bg-[#fbfcfe] p-2.5 text-xs text-slate-600">
                      <div className="flex flex-col gap-1 border-b border-slate-100 pb-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-bold text-[#071224]">Account name</p>
                          <p className="mt-1 leading-4">CAN-CARE Technical Vocational Education Training Assessment and Review Center Institute Inc.</p>
                        </div>
                        <div className="shrink-0 sm:text-right">
                          <p className="font-bold text-[#071224]">Contact</p>
                          <p className="mt-1 leading-5">09938860922</p>
                          <p>(038) 427-5117</p>
                        </div>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        {[
                          { bank: 'Maribank', type: 'Account Number', number: '09938860922', accountName: 'Theresa Garnet Ibale' },
                        ].map((account) => (
                          <div key={`${account.bank}-${account.number}`} className="rounded-lg bg-white p-2.5">
                            <p className="font-bold text-[#0f4da0]">{account.bank}</p>
                            {'accountName' in account ? (
                              <>
                                <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">Account name</p>
                                <p className="mt-1 font-bold text-[#071224]">{account.accountName}</p>
                              </>
                            ) : null}
                            <p className="mt-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">{account.type}</p>
                            <p className="mt-1 font-bold text-[#071224]">{account.number}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    ) : null}
                  </div>

                  <div className="rounded-md bg-white p-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f2ff] text-[#0f4da0]">
                        <ShieldCheck className="h-4 w-4" />
                      </span>
                      <p className="text-sm font-extrabold uppercase tracking-wide text-[#0f2745]">Payment proof</p>
                    </div>

                    <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">i</span>
                      <p>
                        Pay <span className="font-extrabold text-orange-600">30% down payment</span>:
                        {' '}<span className="font-extrabold text-[#071224]">{formatCurrency(requiredDownPayment)}</span>.
                      </p>
                    </div>

                    <div className="mt-3">
                      <label className="text-xs font-bold text-[#0f2745]">Amount paid</label>
                      <div
                        className={cn(
                          'mt-1.5 flex items-center gap-2 rounded-lg border bg-white px-3 py-2 shadow-[0_0_0_3px_rgba(15,77,160,0.05)]',
                          paymentAmount && !paymentMeetsMinimum ? 'border-amber-300' : 'border-[#8bbcff]',
                        )}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#edf4ff] text-xs font-extrabold text-[#0f4da0]">
                          PHP
                        </span>
                        <input
                          type="number"
                          min={requiredDownPayment}
                          step="0.01"
                          value={paymentAmount}
                          onChange={(event) => setPaymentAmount(event.target.value)}
                          placeholder={`Minimum ${formatCurrency(requiredDownPayment)}`}
                          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#071224] outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <p className={cn('mt-1 text-xs font-semibold', paymentMeetsMinimum ? 'text-emerald-700' : 'text-amber-700')}>
                        {paymentAmount
                          ? paymentMeetsMinimum
                            ? `${formatCurrency(paidAmount)} recorded as down payment.`
                            : `Amount must be at least ${formatCurrency(requiredDownPayment)}.`
                          : 'Enter the exact amount shown in your payment proof.'}
                      </p>
                    </div>

                    <div className="mt-3">
                      <label className="text-xs font-bold text-[#0f2745]">Payment reference number</label>
                      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-[#8bbcff] bg-white px-3 py-2 shadow-[0_0_0_3px_rgba(15,77,160,0.05)]">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#edf4ff] text-[#0f4da0]">
                          <FileText className="h-4 w-4" />
                        </span>
                        <input
                          value={paymentReferenceNumber}
                          onChange={(event) => setPaymentReferenceNumber(event.target.value)}
                          placeholder="Enter payment reference number"
                          className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-[#071224] outline-none placeholder:text-slate-400"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs font-bold text-[#0f2745]">Upload payment screenshot</p>
                      <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#8bbcff] bg-[#fbfdff] px-3 py-3 text-center transition hover:border-[#0f4da0] hover:bg-[#edf4ff]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e8f2ff] text-[#0f4da0]">
                          <Upload className="h-4 w-4" />
                        </span>
                        <span className="mt-1.5 text-xs font-extrabold text-[#0f2745]">
                          {paymentProofName || 'Click to upload'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg"
                          className="sr-only"
                          onChange={(event) => handlePaymentProofChange(event.target.files?.[0])}
                        />
                      </label>
                    </div>

                    <div className="mt-3 rounded-lg border border-[#cfe4ff] bg-[#f8fbff] p-2.5">
                      <div className="flex gap-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0f4da0] text-white">
                          <Lightbulb className="h-4 w-4" />
                        </span>
                        <div>
                          <p className="text-xs font-extrabold text-[#0f2745]">Tips for a valid payment proof:</p>
                          <ul className="mt-1.5 space-y-1 text-xs text-[#0f4da0]">
                            <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Clear screenshot</li>
                            <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Amount, date, and reference number visible</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                        <LockKeyhole className="h-3.5 w-3.5" />
                      </span>
                      Used only to verify your booking.
                    </div>

                    {!paymentProofName || !paymentReferenceNumber.trim() || !paymentMeetsMinimum ? (
                      <p className="mt-3 text-xs font-semibold text-amber-700">
                        Please enter an amount of at least {formatCurrency(requiredDownPayment)}, add your reference number, and upload your payment screenshot before submitting.
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-md bg-white p-3">
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-[#fbfcfe] p-3 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={bookingPolicyAccepted}
                        onChange={(event) => setBookingPolicyAccepted(event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-[#0f4da0]"
                      />
                      <span>
                        I have read and agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowBookingPolicyText((current) => !current)}
                          className="font-semibold text-[#0f4da0] underline-offset-4 hover:underline"
                        >
                          booking policy
                        </button>
                        .
                      </span>
                    </div>
                    {showBookingPolicyText ? (
                      <div className="mt-2 space-y-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                        <div>
                          <p className="font-bold text-[#071224]">1. Reservation Requests</p>
                          <p>Submitting a booking creates a reservation request for admin review. Your date and time slot are checked against existing bookings and availability.</p>
                        </div>
                        <div>
                          <p className="font-bold text-[#071224]">2. Schedule Confirmation</p>
                          <p>Final confirmation depends on availability and the resort's review. If adjustments are needed, the resort team will contact you using the details you provide.</p>
                        </div>
                        <div>
                          <p className="font-bold text-[#071224]">3. Deposits and Payments</p>
                          <p>A 30% down payment is required to secure and confirm your booking once it has been approved.</p>
                          <p>Payment instructions will be provided after review, depending on your selected payment method such as GCash or bank transfer.</p>
                          <p>Please keep your payment receipt or screenshot as proof of transaction for verification purposes.</p>
                        </div>
                        <div>
                          <p className="font-bold text-[#071224]">4. Cancellations and No-Shows</p>
                          <p>Cancellation policies may vary depending on the package, selected date, and availability. The resort team will inform you of the applicable cancellation terms during the confirmation process.</p>
                        </div>
                        <div>
                          <p className="font-bold text-[#071224]">5. Contact</p>
                          <p>If you have questions before booking, contact Watikolo at +63 915 874 8529.</p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

              </div>
            ) : null}
          </div>

          <aside className="hidden max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-[#e9dfcc] bg-white p-3 shadow-card lg:sticky lg:top-20 lg:block">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#0f4da0]">Booking Summary</p>
                <h2 className="mt-1 text-base font-semibold text-[#202321]">Your total</h2>
              </div>
              <span className="rounded-full bg-[#edf4ff] px-2.5 py-1 text-[11px] font-semibold text-[#0f4da0]">Live</span>
            </div>

            <div className="mt-3 rounded-lg border border-[#ece2d0] bg-[#fcfbf8] p-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-[#ece2d0] pb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{isRoomBooking ? 'Room' : 'Venue'}</p>
                  <p className="mt-1 font-semibold text-[#202321]">{isRoomBooking ? packageLabel : selectedVenue.name}</p>
                </div>
                <span className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">{formatCurrency(baseEstimate)}</span>
              </div>

              <dl className="mt-2 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between gap-3">
                  <dt>{isRoomBooking ? 'Selected room' : 'Selected package'}</dt>
                  <dd className="font-medium text-[#202321]">{packageLabel}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Guest count</dt>
                  <dd className="font-medium text-[#202321]">{totalGuestCount}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt>Included guests</dt>
                  <dd className="font-medium text-[#202321]">{includedGuests}</dd>
                </div>
                {isRoomBooking ? (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Check-in</dt>
                      <dd className="font-medium text-[#202321]">{formValues.date}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Check-out</dt>
                      <dd className="font-medium text-[#202321]">{checkOutDate}</dd>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Date booked</dt>
                      <dd className="font-medium text-[#202321]">{formValues.date}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Time slot</dt>
                      <dd className="font-medium text-[#202321]">{selectedSlot.label}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt>Preferred start</dt>
                      <dd className="font-medium text-[#202321]">{formatTimeLabel(preferredStartTime)}</dd>
                    </div>
                  </>
                )}
              </dl>
              {canAddAddOns ? (
                <div className="mt-2 border-t border-[#ece2d0] pt-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Add-ons</p>
                  <div className="mt-1.5 space-y-1.5 text-xs text-slate-600">
                    {selectedAddOnDetails.length > 0 ? (
                      selectedAddOnDetails.map((addOn) => (
                        <div key={addOn.name} className="flex items-start justify-between gap-3">
                          <span className="leading-5">{addOn.name}</span>
                          <span className="shrink-0 font-medium text-[#202321]">
                            {formatCurrency(addOn.price)}{addOn.type === 'room' ? '/night' : ''}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400">No add-ons selected</span>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-3 rounded-lg bg-[#f7f7f7] p-2.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>{isRoomBooking ? 'Room total' : 'Package rate'}</span>
                <span className="font-medium text-[#202321]">{formatCurrency(roomStayTotal)}</span>
              </div>
              {isRoomBooking ? (
                <>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>Nightly rate</span>
                    <span className="font-medium text-[#202321]">{formatCurrency(baseEstimate)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>Number of nights</span>
                    <span className="font-medium text-[#202321]">{roomNights}</span>
                  </div>
                </>
              ) : null}
              {canAddAddOns ? (
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>Add-ons</span>
                  <span className="font-medium text-[#202321]">{formatCurrency(addOnsTotal)}</span>
                </div>
              ) : null}
              {!isRoomBooking ? (
                <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                  <span>Additional hours</span>
                  <span className="font-medium text-[#202321]">{formatCurrency(additionalHoursTotal)}</span>
                </div>
              ) : null}
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span>{isRoomBooking ? 'Extra bed fee' : 'Extra guest fee'}</span>
                <span className="font-medium text-[#202321]">{formatCurrency(extraGuestTotal)}</span>
              </div>
              {extraGuestTotal > 0 ? (
                <div className="mt-2 space-y-1 rounded-md bg-white px-2.5 py-2 text-xs text-slate-600">
                  {isRoomBooking ? (
                    <div className="flex items-center justify-between gap-3">
                      <span>Extra beds ({roomExtraBeds} x {formatCurrency(250)})</span>
                      <span className="font-medium text-[#202321]">{formatCurrency(roomExtraBedTotal)}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span>
                          Kids ({chargedExtraKidGuests} x {formatCurrency(selectedExtraGuestRates.kids)})
                        </span>
                        <span className="font-medium text-[#202321]">{formatCurrency(extraKidGuestTotal)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <span>
                          Adults ({chargedExtraAdultGuests} x {formatCurrency(selectedExtraGuestRates.adults)})
                        </span>
                        <span className="font-medium text-[#202321]">{formatCurrency(extraAdultGuestTotal)}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              <div className="mt-2 border-t border-slate-200 pt-2">
                <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                  <span>Required 30% down payment</span>
                  <span className="font-bold text-[#202321]">{formatCurrency(requiredDownPayment)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#202321]">Total amount to pay</span>
                  <span className="text-base font-bold text-[#0f4da0]">{formatCurrency(estimatedTotal)}</span>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs leading-4 text-slate-500">
              {isRoomBooking ? 'Room date, guest details, and final schedule are completed before you submit your request.' : 'Event date, event type, and final schedule are completed before you submit your request.'}
            </p>
          </aside>
        </div>

        {submissionError ? (
          <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700" role="alert">
            {submissionError}
          </p>
        ) : null}

        <div className="fixed inset-x-3 bottom-[4.75rem] z-40 mx-auto max-w-[480px] rounded-lg border border-[#e9dfcc] bg-white/95 p-3 shadow-[0_12px_30px_rgba(15,23,42,0.18)] backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0f4da0]">Booking Summary</p>
              <p className="mt-1 text-xs text-slate-500">Required down payment: <span className="font-bold text-[#202321]">{formatCurrency(requiredDownPayment)}</span></p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Total</p>
              <p className="text-base font-extrabold text-[#0f4da0]">{formatCurrency(estimatedTotal)}</p>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-50 -mx-3 mt-4 border-t border-slate-200 bg-white/95 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 shadow-[0_-8px_18px_rgba(15,23,42,0.08)] backdrop-blur sm:-mx-4 sm:px-4">
          <div className="mx-auto flex max-w-[980px] gap-2">
          <button
            type="button"
            onClick={() => (currentStep === 0 ? navigate(-1) : setCurrentStep((step) => Math.max(0, step - 1)))}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#0a00b8] px-4 text-sm font-bold text-[#0a00b8] transition hover:bg-[#f5f4ff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={isSubmitting || nextDisabled}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-[#4d94a1] px-4 text-sm font-bold text-white transition hover:bg-[#3d7d89] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {currentStep === steps.length - 1 ? (isSubmitting ? 'Saving booking...' : 'Confirm booking') : 'Next'}
            <ArrowRight className="h-4 w-4" />
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
