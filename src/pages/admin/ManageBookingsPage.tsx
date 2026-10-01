import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Eye, Plus, XCircle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { InputField, SelectField, TextAreaField } from '@/components/ui/FormField';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppData } from '@/context/AppDataContext';
import { baseTimeSlots } from '@/mock/timeSlots';
import { appDataService } from '@/services/appDataService';
import type { Booking, BookingFormValues, EventType } from '@/types';
import { startOfToday, toDateKey } from '@/utils/date';
import { formatCapacityLabel, formatCompactDate, formatCurrency, formatRoomCapacityLabel } from '@/utils/format';

const eventTypeOptions: EventType[] = ['Wedding', 'Corporate', 'Birthday', 'Debut', 'Conference', 'Other'];
const poolUseTableCharge = 300;
const roomAdditionalGuestRate = 250;
const roomAdditionalHourRate = 1000;
const roomInclusivePackageNames = new Set(['Deluxe', 'Grand', 'Ultimate']);
const extraGuestRates = {
  day: { label: 'Day Use', kids: 50, adults: 100 },
  night: { label: 'Night Use', kids: 60, adults: 120 },
} as const;
type ExtraGuestUse = keyof typeof extraGuestRates;

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

function getBookingModeLabel(booking: Booking) {
  if (booking.bookingMode === 'room') {
    return 'Room booking';
  }

  if (booking.bookingMode === 'package') {
    return 'Package booking';
  }

  return 'Venue booking';
}

function getBookingItemLabel(booking: Booking) {
  if (booking.packageName) {
    return booking.packageName;
  }

  return booking.venueName;
}

function formatTimeLabel(value?: string) {
  const match = value?.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return undefined;
  }

  const hour = Number(match[1]);
  const minute = match[2];
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;

  return `${displayHour}:${minute} ${period}`;
}

function getScheduleDetails(booking: Booking) {
  const roomStayMatch = booking.notes?.match(/Room stay: check-in ([\d-]+)(?: at 2:00 PM)?, check-out ([\d-]+)(?: at 12:00 NN)?\./);

  if (booking.bookingMode === 'room' && roomStayMatch) {
    return {
      label: 'Check-in / Check-out',
      value: `${formatCompactDate(roomStayMatch[1])} - ${formatCompactDate(roomStayMatch[2])}`,
      subValue: 'Room stay',
    };
  }

  return {
    label: 'Date / Time slot',
    value: formatCompactDate(booking.date),
    subValue: `${booking.timeSlotLabel}${booking.preferredStartTime ? ` / starts ${formatTimeLabel(booking.preferredStartTime)}` : ''}`,
  };
}

function getNoteLines(notes?: string) {
  return notes?.split(/\r?\n/).map((note) => note.trim()).filter(Boolean) ?? [];
}

function getPaymentProofName(notes?: string) {
  return notes?.match(/Payment proof screenshot:\s*(.+?)(?:\. Booking policy accepted\.|$)/)?.[1];
}

function getBookingStatusLabel(booking: Booking) {
  return booking.status === 'pending' && (booking.depositAmount ?? 0) > 0 ? 'partial payment' : booking.status;
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

function getWalkInRoomDetails(roomName?: string, fallbackPrice = 0) {
  if (roomName?.includes('Grand Room')) {
    return {
      displayName: 'Watikolo Grand Room',
      idealGuests: 'Good for 3 Guests',
      price: 2499,
    };
  }

  if (roomName?.includes('Family Room')) {
    return {
      displayName: 'Watikolo Family Room',
      idealGuests: 'Good for 4 Guests',
      price: 3499,
    };
  }

  return {
    displayName: 'Watikolo Luxe Stay',
    idealGuests: 'Good for 2 Guests',
    price: fallbackPrice === 1900 ? 1999 : fallbackPrice || 1999,
  };
}

function createWalkInForm(venueId = 'venue-1'): BookingFormValues {
  return {
    venueId,
    date: toDateKey(startOfToday()),
    timeSlotId: baseTimeSlots[0]?.id ?? '',
    preferredStartTime: baseTimeSlots[0]?.start ?? '08:00',
    eventType: 'Other',
    guests: 30,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    notes: 'Walk-in booking created by admin.',
  };
}

export function ManageBookingsPage() {
  const { bookings, venues, packages, rooms, addOns, createBooking, getSlotStatus, updateBookingDeposit, updateBookingStatus } = useAppData();
  const bookingVenues = useMemo(() => venues.slice(0, 3), [venues]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [proofPreview, setProofPreview] = useState<{ name: string; url: string } | null>(null);
  const [isCreatingWalkIn, setIsCreatingWalkIn] = useState(false);
  const [walkInError, setWalkInError] = useState('');
  const [depositInput, setDepositInput] = useState('');
  const [walkInForm, setWalkInForm] = useState<BookingFormValues>(() => createWalkInForm());
  const [walkInType, setWalkInType] = useState<'package' | 'pool' | 'room'>('package');
  const [selectedWalkInPackageName, setSelectedWalkInPackageName] = useState(packages[0]?.name ?? '');

  const [selectedWalkInRoomNames, setSelectedWalkInRoomNames] = useState<string[]>(() => rooms[0]?.name ? [rooms[0].name] : []);
  const [walkInAdditionalGuests, setWalkInAdditionalGuests] = useState(0);
  const [walkInExtraGuestUse, setWalkInExtraGuestUse] = useState<ExtraGuestUse>('day');
  const [walkInExtraKidGuests, setWalkInExtraKidGuests] = useState(0);
  const [walkInExtraAdultGuests, setWalkInExtraAdultGuests] = useState(0);
  const [selectedWalkInAddOns, setSelectedWalkInAddOns] = useState<string[]>([]);
  const [walkInPaymentMethod, setWalkInPaymentMethod] = useState('Cash');
  const [walkInPaymentType, setWalkInPaymentType] = useState<'down-payment' | 'full-payment'>('down-payment');
  const [walkInPaymentReference, setWalkInPaymentReference] = useState('');
  const [walkInCheckOutDate, setWalkInCheckOutDate] = useState(() => addDaysKey(toDateKey(startOfToday()), 1));
  const [walkInAdditionalHours, setWalkInAdditionalHours] = useState(0);
  const [walkInPoolTableSelected, setWalkInPoolTableSelected] = useState(false);
  const [walkInExtraBeds, setWalkInExtraBeds] = useState(0);

  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId) ?? null;
  const selectedBookingSchedule = selectedBooking ? getScheduleDetails(selectedBooking) : null;
  const selectedBookingNotes = selectedBooking ? getNoteLines(selectedBooking.notes) : [];
  const selectedPaymentProofName = selectedBooking ? selectedBooking.paymentProofName ?? getPaymentProofName(selectedBooking.notes) : undefined;
  const selectedHasPaymentProof = Boolean(selectedBooking && selectedPaymentProofName && (selectedBooking.paymentProofPath || selectedBooking.paymentProofUrl));
  const selectedDepositAmount = selectedBooking?.depositAmount ?? 0;
  const selectedRequiredDownPayment = selectedBooking ? selectedBooking.totalPrice * 0.3 : 0;
  const selectedBalance = selectedBooking ? Math.max(selectedBooking.totalPrice - selectedDepositAmount, 0) : 0;
  const filteredBookings = useMemo(
    () => bookings.filter((booking) => selectedStatus === 'all' || booking.status === selectedStatus),
    [bookings, selectedStatus],
  );
  const todayKey = toDateKey(startOfToday());
  const selectedWalkInSlotStatus = walkInForm.venueId && walkInForm.date && walkInForm.timeSlotId
    ? getSlotStatus(walkInForm.venueId, walkInForm.date, walkInForm.timeSlotId)
    : 'available';
  const selectedWalkInSlot = baseTimeSlots.find((slot) => slot.id === walkInForm.timeSlotId) ?? baseTimeSlots[0];
  const walkInPreferredStartTime = walkInForm.preferredStartTime || selectedWalkInSlot?.start || '08:00';
  const selectedWalkInPackage = packages.find((item) => item.name === selectedWalkInPackageName) ?? packages[0];
  const selectedWalkInRooms = useMemo(
    () => rooms.filter((item) => selectedWalkInRoomNames.includes(item.name)),
    [rooms, selectedWalkInRoomNames],
  );
  const selectedWalkInRoomDetails = selectedWalkInRooms.map((room) => getWalkInRoomDetails(room.name, room.price));
  const selectedWalkInRoomLabel = selectedWalkInRoomDetails.map((room) => room.displayName).join(', ');
  const selectedWalkInRoomNightlyTotal = selectedWalkInRoomDetails.reduce((sum, room) => sum + room.price, 0);
  const walkInRoomNights = walkInType === 'room' ? getNightsBetween(walkInForm.date, walkInCheckOutDate) : 1;
  const selectedWalkInRoomGuestRange = useMemo(() => {
    if (selectedWalkInRooms.length === 0) {
      return { min: 1, max: 1, included: 1 };
    }

    return selectedWalkInRooms.reduce((sum, room) => {
      const range = getRoomGuestRange(room.name);
      return { min: 1, max: sum.max + range.max, included: sum.included + range.included };
    }, { min: 1, max: 0, included: 0 });
  }, [selectedWalkInRooms]);
  const unavailableWalkInRoomNames = useMemo(
    () =>
      new Set(
        rooms
          .filter((room) =>
            bookings.some((booking) => {
              const roomInclusivePackage = booking.bookingMode === 'package' && (
                (typeof booking.packageIndex === 'number' && booking.packageIndex >= 3) ||
                roomInclusivePackageNames.has(booking.packageName ?? '')
              );

              return (
                booking.date === walkInForm.date &&
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
    [bookings, rooms, walkInForm.date],
  );
  const selectedWalkInRoomUnavailable = walkInType === 'room' && selectedWalkInRooms.some((room) => unavailableWalkInRoomNames.has(room.name));
  const walkInSelectedExtraGuestRates = extraGuestRates[walkInExtraGuestUse];
  const walkInPackageIndex = packages.findIndex((item) => item.name === selectedWalkInPackage?.name);
  const walkInExtraGuestCount = walkInExtraKidGuests + walkInExtraAdultGuests;
  const walkInShouldAutoCountGuests = walkInType !== 'room';
  const walkInHasFreeExtraGuests = walkInType === 'package' && (walkInPackageIndex >= 3 || roomInclusivePackageNames.has(selectedWalkInPackage?.name ?? ''));
  const walkInExtraKidGuestTotal = walkInType !== 'room' && !walkInHasFreeExtraGuests ? walkInExtraKidGuests * walkInSelectedExtraGuestRates.kids : 0;
  const walkInExtraAdultGuestTotal = walkInType !== 'room' && !walkInHasFreeExtraGuests ? walkInExtraAdultGuests * walkInSelectedExtraGuestRates.adults : 0;
  const walkInAdditionalGuestTotal = walkInType === 'room'
    ? walkInExtraBeds * roomAdditionalGuestRate
    : walkInExtraKidGuestTotal + walkInExtraAdultGuestTotal;
  const walkInAdditionalHoursTotal = walkInType === 'room' ? walkInAdditionalHours * roomAdditionalHourRate : 0;
  const canAddWalkInAddOns = walkInType === 'package' && walkInPackageIndex >= 0 && walkInPackageIndex <= 2;
  const canAddWalkInRooms = walkInType === 'package' && walkInPackageIndex >= 0 && walkInPackageIndex <= 2;
  const availableWalkInAddOns = !canAddWalkInAddOns
    ? []
    : [
        ...addOns.map((addOn) => ({ ...addOn, type: 'service' as const })),
        ...(canAddWalkInRooms
          ? rooms.map((room) => ({
              name: `${room.name} Room Add-on`,
              price: room.price,
              description: formatRoomCapacityLabel(room.name, room.capacity),
              type: 'room' as const,
              image: room.image,
              unavailable: unavailableWalkInRoomNames.has(room.name),
            }))
          : []),
      ];
  const selectedWalkInAddOnDetails = availableWalkInAddOns.filter((addOn) => selectedWalkInAddOns.includes(addOn.name) && !('unavailable' in addOn && addOn.unavailable));
  const selectedWalkInRoomAddOns = selectedWalkInAddOnDetails
    .filter((addOn) => addOn.type === 'room')
    .map((addOn) => addOn.name.replace(/ Room Add-on$/, ''));
  const walkInAddOnsTotal = selectedWalkInAddOnDetails.reduce((sum, addOn) => sum + addOn.price, 0);
  const walkInBaseTotal = walkInType === 'pool'
    ? walkInPoolTableSelected ? poolUseTableCharge : 0
    : walkInType === 'room'
      ? selectedWalkInRoomNightlyTotal * walkInRoomNights
      : selectedWalkInPackage?.price ?? 0;
  const walkInTotal = walkInBaseTotal + walkInAdditionalGuestTotal + walkInAddOnsTotal + walkInAdditionalHoursTotal;
  const walkInDownPayment = walkInTotal * 0.3;
  const walkInPaidAmount = walkInPaymentType === 'full-payment' ? walkInTotal : walkInDownPayment;
  const walkInBalance = Math.max(walkInTotal - walkInPaidAmount, 0);
  const walkInNeedsPaymentReference = walkInPaymentMethod !== 'Cash';
  const canCreateWalkIn =
    Boolean(walkInForm.customerName.trim()) &&
    (!walkInNeedsPaymentReference || Boolean(walkInPaymentReference.trim())) &&
    walkInForm.guests > 0 &&
    (walkInType === 'room' || selectedWalkInSlotStatus === 'available') &&
    (walkInType === 'pool' || (walkInType === 'package' && Boolean(selectedWalkInPackage)) || (walkInType === 'room' && selectedWalkInRooms.length > 0 && !selectedWalkInRoomUnavailable));

  useEffect(() => {
    setDepositInput(selectedBooking ? String(selectedBooking.depositAmount ?? 0) : '');
  }, [selectedBooking]);

  useEffect(() => {
    if (!walkInShouldAutoCountGuests) {
      return;
    }

    const nextGuestCount = walkInType === 'package'
      ? (selectedWalkInPackage?.minGuests ?? 0) + walkInExtraGuestCount
      : Math.max(1, walkInExtraGuestCount);
    if (walkInForm.guests !== nextGuestCount) {
      setWalkInForm((current) => ({ ...current, guests: nextGuestCount }));
    }
  }, [selectedWalkInPackage, walkInExtraGuestCount, walkInForm.guests, walkInShouldAutoCountGuests, walkInType]);

  useEffect(() => {
    if (walkInType !== 'room') {
      return;
    }

    const nextGuestCount = Math.min(Math.max(walkInForm.guests, selectedWalkInRoomGuestRange.min), selectedWalkInRoomGuestRange.max);
    if (walkInForm.guests !== nextGuestCount) {
      setWalkInForm((current) => ({ ...current, guests: nextGuestCount }));
      return;
    }

    const nextAdditionalGuests = Math.max(0, nextGuestCount - selectedWalkInRoomGuestRange.included);
    if (walkInAdditionalGuests !== nextAdditionalGuests) {
      setWalkInAdditionalGuests(nextAdditionalGuests);
    }
  }, [selectedWalkInRoomGuestRange, walkInAdditionalGuests, walkInForm.guests, walkInType]);

  useEffect(() => {
    if (walkInType !== 'room') {
      setWalkInExtraBeds(0);
    }
  }, [walkInType]);

  const openWalkInModal = () => {
    setWalkInForm(createWalkInForm(bookingVenues[0]?.id ?? 'venue-1'));
    setWalkInType('package');
    setSelectedWalkInPackageName(packages[0]?.name ?? '');
    setSelectedWalkInRoomNames(rooms[0]?.name ? [rooms[0].name] : []);
    setWalkInAdditionalGuests(0);
    setWalkInExtraGuestUse('day');
    setWalkInExtraKidGuests(0);
    setWalkInExtraAdultGuests(0);
    setSelectedWalkInAddOns([]);
    setWalkInPaymentMethod('Cash');
    setWalkInPaymentType('down-payment');
    setWalkInPaymentReference('');
    setWalkInCheckOutDate(addDaysKey(todayKey, 1));
    setWalkInAdditionalHours(0);
    setWalkInPoolTableSelected(false);
    setWalkInExtraBeds(0);
    setIsWalkInOpen(true);
  };

  const setWalkInField = <K extends keyof BookingFormValues>(field: K, value: BookingFormValues[K]) => {
    setWalkInForm((current) => ({ ...current, [field]: value }));
  };

  const toggleWalkInAddOn = (name: string) => {
    const addOn = availableWalkInAddOns.find((item) => item.name === name);

    if (addOn && 'unavailable' in addOn && addOn.unavailable) {
      return;
    }

    setSelectedWalkInAddOns((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  };

  const handleWalkInDateChange = (date: string) => {
    const nextDate = date < todayKey ? todayKey : date;
    setWalkInField('date', nextDate);
    setWalkInCheckOutDate((current) => current <= nextDate ? addDaysKey(nextDate, 1) : current);
  };

  const setWalkInGuestCount = (guestCount: number) => {
    if (walkInType === 'room') {
      const nextGuestCount = Math.min(Math.max(guestCount, selectedWalkInRoomGuestRange.min), selectedWalkInRoomGuestRange.max);
      setWalkInField('guests', nextGuestCount);
      setWalkInAdditionalGuests(Math.max(0, nextGuestCount - selectedWalkInRoomGuestRange.included));
      return;
    }

    setWalkInField('guests', Math.max(1, guestCount));
  };

  const handleStatusUpdate = async (status: 'approved' | 'completed' | 'cancelled' | 'rejected') => {
    if (!selectedBookingId) {
      return;
    }

    const bookingId = selectedBookingId;
    if (status === 'rejected') {
      setIsRejectOpen(false);
    }
    setSelectedBookingId(null);
    void updateBookingStatus(bookingId, status).catch((error) => {
      window.alert(error instanceof Error ? error.message : 'Unable to save the booking status.');
    });
  };

  const toggleWalkInRoom = (name: string) => {
    if (unavailableWalkInRoomNames.has(name)) {
      return;
    }

    setSelectedWalkInRoomNames((current) => current.includes(name)
      ? current.filter((roomName) => roomName !== name)
      : [...current, name]);
  };

  const handleCreateWalkIn = async () => {
    if (!canCreateWalkIn || isCreatingWalkIn) {
      return;
    }

    setIsCreatingWalkIn(true);
    setWalkInError('');
    try {
      const packageIndex = packages.findIndex((item) => item.name === selectedWalkInPackage?.name);
      const walkInExtraGuestNote = walkInAdditionalGuestTotal > 0
        ? walkInType === 'room'
          ? `Extra bed fee: ${walkInExtraBeds} bed(s) at ${formatCurrency(roomAdditionalGuestRate)} each.`
          : `Extra guest fee: ${walkInExtraKidGuests} kid(s) at ${formatCurrency(walkInSelectedExtraGuestRates.kids)} each and ${walkInExtraAdultGuests} adult(s) at ${formatCurrency(walkInSelectedExtraGuestRates.adults)} each (${walkInSelectedExtraGuestRates.label}).`
        : walkInHasFreeExtraGuests && (walkInExtraKidGuests + walkInExtraAdultGuests) > 0
          ? `Extra guest fee waived for ${selectedWalkInPackage?.name ?? 'selected package'}: ${walkInExtraKidGuests} kid(s) and ${walkInExtraAdultGuests} adult(s).`
          : '';
      const walkInAddOnNote = selectedWalkInAddOnDetails.length > 0
        ? `Selected add-ons: ${selectedWalkInAddOnDetails.map((addOn) => addOn.name).join(', ')}.`
        : '';
      const walkInPaymentReferenceNote = walkInNeedsPaymentReference ? ` Payment reference number: ${walkInPaymentReference.trim()}.` : '';
      const walkInPaymentNote = walkInPaymentType === 'full-payment'
        ? `Payment method: ${walkInPaymentMethod}.${walkInPaymentReferenceNote} Fully paid amount received: ${formatCurrency(walkInPaidAmount)}.`
        : `Payment method: ${walkInPaymentMethod}.${walkInPaymentReferenceNote} Required 30% down payment: ${formatCurrency(walkInDownPayment)}. Partial payment received to reserve the selected date.`;
      const walkInPreferredStartTimeNote = walkInType === 'package' && walkInPreferredStartTime
        ? `Preferred start time: ${formatTimeLabel(walkInPreferredStartTime)}.`
        : '';
      const walkInRoomStayNote = walkInType === 'room'
        ? `Room stay: check-in ${walkInForm.date} at 2:00 PM, check-out ${walkInCheckOutDate} at 12:00 NN.`
        : '';
      const walkInRoomGuestNote = walkInType === 'room'
        ? `Guests checked in: ${walkInForm.guests}. Included occupancy: ${selectedWalkInRoomGuestRange.included}. Extra bed: ${walkInExtraBeds > 0 ? `${walkInExtraBeds} selected` : 'not selected'}.`
        : '';
      const walkInAdditionalHoursNote = walkInType === 'room' && walkInAdditionalHours > 0
        ? `Additional hours: ${walkInAdditionalHours} hour(s) at ${formatCurrency(roomAdditionalHourRate)} per hour.`
        : '';
      const walkInNotes = [
        walkInForm.notes.trim() || 'Walk-in booking created by admin.',
        walkInType === 'pool'
          ? `Walk-in type: Pool use only.${walkInPoolTableSelected ? ` Table fee: ${formatCurrency(poolUseTableCharge)}.` : ''}`
          : walkInType === 'room'
            ? `Walk-in rooms: ${selectedWalkInRoomLabel} (${formatCurrency(selectedWalkInRoomNightlyTotal)}/night for ${walkInRoomNights} night(s)). Optional extra bed rate: ${formatCurrency(roomAdditionalGuestRate)}.`
            : `Walk-in package: ${selectedWalkInPackage?.name ?? 'Selected package'} (${formatCurrency(walkInTotal)}).`,
        walkInExtraGuestNote,
        walkInAddOnNote,
        walkInPreferredStartTimeNote,
        walkInRoomStayNote,
        walkInRoomGuestNote,
        walkInAdditionalHoursNote,
        walkInPaymentNote,
      ].filter(Boolean).join('\n');
      const createdBooking = await createBooking({
        ...walkInForm,
        bookingMode: walkInType === 'room' ? 'room' : 'package',
        packageName: walkInType === 'pool' ? 'Pool use only' : walkInType === 'room' ? selectedWalkInRooms[0]?.name : selectedWalkInPackage?.name,
        packageIndex: walkInType === 'package' ? packageIndex : undefined,
        preferredStartTime: walkInType === 'package' ? walkInPreferredStartTime : undefined,
        roomAddOns: walkInType === 'room' ? selectedWalkInRooms.map((room) => room.name) : selectedWalkInRoomAddOns,
        customerName: walkInForm.customerName.trim(),
        customerEmail: walkInForm.customerEmail.trim() || 'watikoloeventvenuerental@gmail.com',
        customerPhone: walkInForm.customerPhone.trim(),
        notes: walkInNotes,
        totalPrice: walkInTotal,
        depositAmount: walkInPaidAmount,
      });
      if (walkInPaymentType === 'full-payment') {
        void updateBookingStatus(createdBooking.id, 'approved').catch((error) => {
          window.alert(error instanceof Error ? error.message : 'Unable to approve the walk-in booking.');
        });
      }
      setSelectedStatus(walkInPaymentType === 'full-payment' ? 'approved' : 'pending');
      setIsWalkInOpen(false);
      setWalkInForm(createWalkInForm(bookingVenues[0]?.id ?? 'venue-1'));
      setSelectedWalkInAddOns([]);
      setWalkInPaymentType('down-payment');
      setWalkInPaymentReference('');
      setWalkInAdditionalHours(0);
    } catch (error) {
      setWalkInError(error instanceof Error ? error.message : 'Unable to save walk-in booking. Please try another schedule.');
    } finally {
      setIsCreatingWalkIn(false);
    }
  };

  const handleSaveDeposit = async () => {
    if (!selectedBooking) {
      return;
    }

    const depositAmount = Math.max(0, Math.min(Number(depositInput) || 0, selectedBooking.totalPrice));
    await updateBookingDeposit(selectedBooking.id, depositAmount);
    setDepositInput(String(depositAmount));
  };

  const openPaymentProofPreview = async (booking: Booking, proofName?: string) => {
    if (!proofName) {
      return;
    }

    try {
      if (booking.paymentProofPath) {
        const { signedUrl } = await appDataService.getPaymentProofSignedUrl(booking.paymentProofPath);
        setProofPreview({ name: proofName, url: signedUrl });
        return;
      }

      if (booking.paymentProofUrl) {
        setProofPreview({ name: proofName, url: booking.paymentProofUrl });
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to open payment proof.');
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="rounded-[14px] border border-white/80 bg-white px-3 py-3 shadow-card sm:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-ink sm:text-xl">Manage bookings</h1>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">Review requests and move them through approval.</p>
          </div>
          <button
            type="button"
            onClick={openWalkInModal}
            className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-[#005fb8] px-3 text-xs font-bold text-white shadow-card transition hover:bg-[#004f99] sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Walk-in
          </button>
        </div>

        <div className="mt-3 flex max-w-full flex-nowrap gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {['all', 'pending', 'approved', 'completed', 'cancelled', 'rejected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelectedStatus(status)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold capitalize transition ${
                selectedStatus === status
                  ? 'bg-ink text-white shadow-[0_8px_24px_rgba(15,23,42,0.18)]'
                  : 'bg-white text-slate-600 ring-1 ring-slate-100 hover:bg-slate-50 hover:text-ink'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        data={filteredBookings}
        columns={[
          {
            key: 'reference',
            label: 'Reference',
            render: (row) => (
              <div>
                <p className="font-semibold text-ink">{row.reference}</p>
                <p className="text-[11px] text-slate-500">{getBookingModeLabel(row)}</p>
              </div>
            ),
          },
          {
            key: 'booking',
            label: 'Booking',
            render: (row) => (
              <div>
                <p className="font-semibold text-ink">{getBookingItemLabel(row)}</p>
                <p className="text-[11px] text-slate-500">{row.venueName}</p>
                {row.roomAddOns && row.roomAddOns.length > 0 ? (
                  <p className="mt-0.5 text-[11px] text-[#005fb8]">Rooms: {row.roomAddOns.join(', ')}</p>
                ) : null}
              </div>
            ),
          },
          { key: 'customer', label: 'Customer', render: (row) => <div><p className="font-semibold text-ink">{row.customerName}</p><p className="text-[11px] text-slate-500">{row.customerEmail}</p><p className="text-[11px] text-slate-400">{row.customerPhone ?? 'No phone saved'}</p></div> },
          {
            key: 'schedule',
            label: 'Schedule / Guests',
            render: (row) => {
              const schedule = getScheduleDetails(row);

              return <div><p className="font-semibold text-ink">{schedule.value}</p><p className="text-[11px] text-slate-500">{schedule.subValue}</p><p className="text-[11px] text-slate-400">{row.guests} guests</p></div>;
            },
          },
          {
            key: 'payment',
            label: 'Payment',
            render: (row) => {
              const depositAmount = row.depositAmount ?? 0;
              const balance = Math.max(row.totalPrice - depositAmount, 0);
              const proofName = row.paymentProofName ?? getPaymentProofName(row.notes);

              return (
                <div>
                  <p className="font-semibold text-ink">{formatCurrency(depositAmount)} paid</p>
                  <p className="text-[11px] text-slate-500">{formatCurrency(balance)} balance</p>
                  {proofName && (row.paymentProofPath || row.paymentProofUrl) ? (
                    <button
                      type="button"
                      onClick={() => void openPaymentProofPreview(row, proofName)}
                      className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Proof
                    </button>
                  ) : null}
                </div>
              );
            },
          },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={getBookingStatusLabel(row)} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-1">
                <button type="button" aria-label={`View ${row.reference}`} title="View" onClick={() => setSelectedBookingId(row.id)} className="interactive-ring inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200"><Eye className="h-3.5 w-3.5" /></button>
                <button type="button" aria-label={`Reject ${row.reference}`} title="Reject" onClick={() => { setSelectedBookingId(row.id); setIsRejectOpen(true); }} className="interactive-ring inline-flex h-7 w-7 items-center justify-center rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100"><XCircle className="h-3.5 w-3.5" /></button>
              </div>
            ),
          },
        ]}
        compact
      />

      <Drawer open={Boolean(selectedBooking)} onClose={() => setSelectedBookingId(null)} title="Booking details">
        {selectedBooking ? (
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">Reference</p><p className="mt-2 font-semibold text-ink">{selectedBooking.reference}</p><p>{getBookingModeLabel(selectedBooking)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">Client</p><p className="mt-2 font-semibold text-ink">{selectedBooking.customerName}</p><p>{selectedBooking.customerEmail}</p><p>{selectedBooking.customerPhone ?? 'No phone saved'}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">Booking</p><p className="mt-2 font-semibold text-ink">{getBookingItemLabel(selectedBooking)}</p><p>{selectedBooking.venueName}</p><p>{selectedBooking.eventType}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">{selectedBookingSchedule?.label}</p><p className="mt-2 font-semibold text-ink">{selectedBookingSchedule?.value}</p><p>{selectedBookingSchedule?.subValue}</p></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">{selectedBooking.bookingMode === 'room' ? 'Guests checked in' : 'Guests'}</p><p className="mt-2 font-semibold text-ink">{selectedBooking.guests}</p></div>
              <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">Total amount to pay</p><p className="mt-2 font-semibold text-ink">{formatCurrency(selectedBooking.totalPrice)}</p></div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-slate-400">Payment proof</p>
                  <p className="mt-2 font-semibold text-ink">{selectedPaymentProofName ?? 'No screenshot uploaded'}</p>
                  <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    Required 30% down payment: {formatCurrency(selectedRequiredDownPayment)}
                  </p>
                </div>
                {selectedHasPaymentProof ? (
                  <button
                    type="button"
                    onClick={() => void openPaymentProofPreview(selectedBooking, selectedPaymentProofName)}
                    className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open proof
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                <InputField
                  label="Deposit paid"
                  type="number"
                  min="0"
                  max={selectedBooking.totalPrice}
                  value={depositInput}
                  onChange={(event) => setDepositInput(event.target.value)}
                  hint="Manually enter the verified deposit amount from the screenshot or receipt."
                />
                <Button variant="secondary" onClick={() => void handleSaveDeposit()}>
                  Save deposit
                </Button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-xs text-slate-400">Amount paid</p>
                  <p className="mt-1 font-semibold text-emerald-700">{formatCurrency(selectedDepositAmount)}</p>
                </div>
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-xs text-slate-400">Remaining balance</p>
                  <p className="mt-1 font-semibold text-ink">{formatCurrency(selectedBalance)}</p>
                </div>
              </div>
            </div>
            {selectedBooking.roomAddOns && selectedBooking.roomAddOns.length > 0 ? (
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-slate-400">Room add-ons</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedBooking.roomAddOns.map((room) => (
                    <span key={room} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#005fb8] ring-1 ring-slate-200">
                      {room}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="sticky bottom-0 -mx-6 grid gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur sm:grid-cols-2">
              <Button variant="secondary" onClick={() => handleStatusUpdate('approved')}>Approve</Button>
              <Button variant="ghost" onClick={() => handleStatusUpdate('completed')}>Mark completed</Button>
              <Button variant="danger" onClick={() => { setIsRejectOpen(true); }}>Reject</Button>
            </div>
          </div>
        ) : null}
      </Drawer>

      <Modal open={isRejectOpen} onClose={() => setIsRejectOpen(false)} title="Reject booking request">
        <p className="text-sm leading-7 text-slate-600">Rejecting this booking will free the slot and move the request out of the active reservation queue.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsRejectOpen(false)}>Close</Button>
          <Button variant="danger" onClick={() => handleStatusUpdate('rejected')}>Reject request</Button>
        </div>
      </Modal>

      <Modal open={Boolean(proofPreview)} onClose={() => setProofPreview(null)} title="Payment proof" className="max-w-3xl">
        {proofPreview ? (
          <div>
            <p className="mb-3 text-sm font-semibold text-ink">{proofPreview.name}</p>
            <img
              src={proofPreview.url}
              alt={proofPreview.name}
              className="max-h-[70vh] w-full rounded-xl border border-slate-200 object-contain"
            />
          </div>
        ) : null}
      </Modal>

      <Modal open={isWalkInOpen} onClose={() => setIsWalkInOpen(false)} title="Create walk-in booking" className="max-w-4xl">
        <div className="grid min-h-0 gap-4 pb-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-3">
            <section className="rounded-lg bg-[#f4f4f7] p-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#005fb8]">Type</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {[
                  { value: 'package', label: 'Package' },
                  { value: 'room', label: 'Room' },
                  { value: 'pool', label: 'Pool use only' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      const nextType = option.value as 'package' | 'room' | 'pool';
                      setWalkInType(nextType);
                      if (nextType === 'pool') {
                        setWalkInField('eventType', 'Other');
                        setSelectedWalkInAddOns([]);
                        setWalkInExtraKidGuests(0);
                        setWalkInExtraAdultGuests(0);
                        setWalkInPoolTableSelected(false);
                      } else if (nextType === 'package' && selectedWalkInPackage) {
                        setWalkInField('guests', Math.max(walkInForm.guests, selectedWalkInPackage.minGuests));
                        setWalkInPoolTableSelected(false);
                      } else if (nextType === 'room') {
                        const roomNames = selectedWalkInRoomNames.length > 0
                          ? selectedWalkInRoomNames
                          : rooms[0]?.name ? [rooms[0].name] : [];
                        const includedGuests = rooms
                          .filter((room) => roomNames.includes(room.name))
                          .reduce((sum, room) => sum + getRoomGuestRange(room.name).included, 0);
                        setSelectedWalkInRoomNames(roomNames);
                        setWalkInField('guests', Math.max(1, includedGuests));
                        setSelectedWalkInAddOns([]);
                        setWalkInPoolTableSelected(false);
                      }
                    }}
                    className={`rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                      walkInType === option.value
                        ? 'border-[#005fb8] bg-white text-[#005fb8] shadow-card'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {walkInType === 'package' ? (
              <section className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
                <p className="text-sm font-bold text-ink">Package</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {packages.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => {
                        setSelectedWalkInPackageName(item.name);
                        setWalkInField('guests', Math.max(walkInForm.guests, item.minGuests));
                      }}
                      className={`rounded-lg border p-2.5 text-left transition ${
                        selectedWalkInPackageName === item.name
                          ? 'border-[#005fb8] bg-[#edf4ff]'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="block text-sm font-bold text-ink">{item.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{formatCapacityLabel(item.guestLabel)}</span>
                      <span className="mt-1 block text-sm font-bold text-[#005fb8]">{formatCurrency(item.price)}</span>
                    </button>
                  ))}
                </div>
                {walkInPackageIndex < 4 ? (
                <div className="mt-4">
                  <p className="text-sm font-bold text-ink">Venue</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {bookingVenues.map((venueOption) => {
                      const selected = walkInForm.venueId === venueOption.id;

                      return (
                        <button
                          key={venueOption.id}
                          type="button"
                          onClick={() => setWalkInField('venueId', venueOption.id)}
                          className={`rounded-lg border text-left transition ${
                            selected
                              ? 'border-[#005fb8] bg-[#edf4ff] p-2 shadow-card'
                              : 'flex items-center gap-2 border-slate-200 bg-white p-1.5 hover:border-[#005fb8]'
                          }`}
                        >
                          {selected ? (
                            <>
                              <img src={venueOption.heroImage} alt={venueOption.name} className="h-28 w-full rounded-md object-cover" />
                              <span className="mt-2 block text-sm font-bold text-ink">{venueOption.name}</span>
                              <span className="mt-1 block text-xs leading-5 text-slate-500">{venueOption.shortDescription}</span>
                              <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#005fb8] ring-1 ring-[#bfdbfe]">
                                Selected venue
                              </span>
                            </>
                          ) : (
                            <>
                              <img src={venueOption.heroImage} alt={venueOption.name} className="h-12 w-14 rounded object-cover" />
                              <span className="text-xs font-bold text-ink">{venueOption.name}</span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
                ) : null}
              </section>
            ) : null}

            {walkInType === 'room' ? (
              <section className="rounded-lg bg-white p-3 ring-1 ring-slate-100">
                <p className="text-sm font-bold text-ink">Rooms</p>
                <p className="mt-1 text-xs text-slate-500">Select one or more available rooms.</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {rooms.map((room) => {
                    const unavailable = unavailableWalkInRoomNames.has(room.name);
                    const details = getWalkInRoomDetails(room.name, room.price);

                    return (
                      <button
                        key={room.name}
                        type="button"
                        disabled={unavailable}
                        onClick={() => toggleWalkInRoom(room.name)}
                        className={`overflow-hidden rounded-lg border text-left transition ${
                          selectedWalkInRoomNames.includes(room.name)
                            ? 'border-[#005fb8] bg-[#edf4ff]'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        } ${unavailable ? 'cursor-not-allowed opacity-55' : ''}`}
                      >
                        <img src={room.image} alt={room.name} className="h-16 w-full object-cover" />
                        <span className="block p-2.5">
                          <span className="block text-sm font-bold text-ink">{details.displayName}</span>
                          <span className="mt-1 block text-xs font-semibold text-slate-600">{details.idealGuests}</span>
                          <span className="mt-2 flex items-center justify-between gap-2 text-xs">
                            <span className="font-bold text-[#005fb8]">{formatCurrency(details.price)}/night</span>
                            {unavailable ? <span className="font-bold text-rose-600">Unavailable</span> : null}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {walkInType === 'pool' ? (
              <section className="rounded-lg border border-slate-100 bg-white p-3">
                <p className="text-sm font-bold text-ink">Pool use only</p>
                <button
                  type="button"
                  onClick={() => setWalkInPoolTableSelected((selected) => !selected)}
                  className={`mt-2 flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm font-bold transition ${
                    walkInPoolTableSelected
                      ? 'border-[#005fb8] bg-[#edf4ff] text-[#005fb8]'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-[#005fb8]'
                  }`}
                >
                  <span>Table fee</span>
                  <span>{formatCurrency(poolUseTableCharge)}</span>
                </button>
              </section>
            ) : null}

            <section className="order-2 rounded-lg border border-[#dbeafe] bg-[#f8fbff] p-3">
              {walkInType === 'room' ? (
                <>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-bold text-ink">Extra bed</p>
                    <span className="text-xs font-bold text-[#005fb8]">{formatCurrency(walkInAdditionalGuestTotal)}</span>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                    <InputField
                      label={`Extra beds (${formatCurrency(roomAdditionalGuestRate)} each)`}
                      type="number"
                      min="0"
                      value={String(walkInExtraBeds)}
                      onChange={(event) => setWalkInExtraBeds(toNonNegativeInteger(Number(event.target.value)))}
                    />
                    <div className="rounded-lg bg-white px-3 py-2 text-xs text-slate-600">
                      <span className="block">Extra bed fee</span>
                      <span className="mt-1 block font-bold text-ink">
                        {walkInExtraBeds > 0 ? `${walkInExtraBeds} x ${formatCurrency(roomAdditionalGuestRate)}` : 'Not added'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <InputField
                      label={`Extra hours (${formatCurrency(roomAdditionalHourRate)}/hr)`}
                      type="number"
                      min="0"
                      value={String(walkInAdditionalHours)}
                      onChange={(event) => setWalkInAdditionalHours(toNonNegativeInteger(Number(event.target.value)))}
                    />
                  </div>
                </>
              ) : (
                <>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-ink">Extra guests</p>
                  <span className="text-xs font-bold text-[#005fb8]">{formatCurrency(walkInAdditionalGuestTotal)}</span>
                </div>
                {walkInHasFreeExtraGuests ? (
                  <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Extra guest fee is free for this package.</p>
                ) : null}
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {(['day', 'night'] as ExtraGuestUse[]).map((use) => {
                    const rate = extraGuestRates[use];

                    return (
                      <button
                        key={use}
                        type="button"
                        onClick={() => setWalkInExtraGuestUse(use)}
                        className={`rounded-lg border bg-white px-3 py-2 text-left text-xs transition ${
                          walkInExtraGuestUse === use ? 'border-[#005fb8] ring-2 ring-[#dbeafe]' : 'border-slate-200 hover:border-[#005fb8]'
                        }`}
                      >
                        <span className="block font-bold text-ink">{rate.label}</span>
                        <span className="mt-1 block text-slate-500">Kids {formatCurrency(rate.kids)} / Adults {formatCurrency(rate.adults)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <InputField
                    label="Extra kids"
                    type="number"
                    min="0"
                    value={String(walkInExtraKidGuests)}
                    onChange={(event) => setWalkInExtraKidGuests(toNonNegativeInteger(Number(event.target.value)))}
                  />
                  <InputField
                    label="Extra adults"
                    type="number"
                    min="0"
                    value={String(walkInExtraAdultGuests)}
                    onChange={(event) => setWalkInExtraAdultGuests(toNonNegativeInteger(Number(event.target.value)))}
                  />
                </div>
                </>
              )}
            </section>

            {canAddWalkInAddOns ? (
              <section className="order-3 rounded-lg bg-white p-3 ring-1 ring-slate-100">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-ink">Add-ons</p>
                  <span className="text-xs font-bold text-[#005fb8]">{formatCurrency(walkInAddOnsTotal)} selected</span>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {availableWalkInAddOns.map((addOn) => {
                    const selected = selectedWalkInAddOns.includes(addOn.name);
                    const image = 'image' in addOn ? addOn.image : null;
                    const unavailable = 'unavailable' in addOn && addOn.unavailable;

                    return (
                      <button
                        key={addOn.name}
                        type="button"
                        disabled={unavailable}
                        onClick={() => toggleWalkInAddOn(addOn.name)}
                        className={`rounded-lg border p-2.5 text-left transition ${
                          unavailable
                            ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
                            : selected
                              ? 'border-[#005fb8] bg-[#edf4ff]'
                              : 'border-slate-200 hover:border-[#005fb8]'
                        }`}
                      >
                        {image ? <img src={image} alt={addOn.name} className="mb-2 h-16 w-full rounded-md object-cover" /> : null}
                        <span className="flex items-start justify-between gap-3">
                          <span>
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-ink">{addOn.name}</span>
                              <span className="rounded-full bg-[#f3efe6] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                {unavailable ? 'Unavailable' : addOn.type === 'room' ? 'Room' : 'Add-on'}
                              </span>
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">{unavailable ? 'Already booked for this date' : addOn.description}</span>
                          </span>
                          <span className="shrink-0 text-xs font-bold text-[#005fb8]">{formatCurrency(addOn.price)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="order-1 rounded-lg bg-white p-3 ring-1 ring-slate-100">
              <p className="text-sm font-bold text-ink">Guest & schedule</p>
              <div className="mt-2 grid gap-2.5 md:grid-cols-2">
                <InputField
                  label="Customer name"
                  value={walkInForm.customerName}
                  onChange={(event) => setWalkInField('customerName', event.target.value)}
                  placeholder="Guest full name"
                />
                <InputField
                  label="Phone number"
                  value={walkInForm.customerPhone}
                  onChange={(event) => setWalkInField('customerPhone', event.target.value)}
                  placeholder="09xx xxx xxxx"
                />
                <InputField
                  label="Email"
                  type="email"
                  value={walkInForm.customerEmail}
                  onChange={(event) => setWalkInField('customerEmail', event.target.value)}
                  placeholder="Optional"
                />
                {walkInType === 'room' ? (
                  <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>Guests</span>
                    <div className="flex h-11 items-center justify-between rounded-xl border border-slate-200 bg-white px-3">
                      <button
                        type="button"
                        onClick={() => setWalkInGuestCount(walkInForm.guests - 1)}
                        disabled={walkInForm.guests <= selectedWalkInRoomGuestRange.min}
                        className="grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-lg font-bold text-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        -
                      </button>
                      <span className="text-lg font-bold text-ink">{walkInForm.guests}</span>
                      <button
                        type="button"
                        onClick={() => setWalkInGuestCount(walkInForm.guests + 1)}
                        disabled={walkInForm.guests >= selectedWalkInRoomGuestRange.max}
                        className="grid h-8 w-8 place-items-center rounded-full bg-[#005fb8] text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ) : (
                  <InputField
                    label="Guest count"
                    type="number"
                    min="1"
                    readOnly
                    value={String(walkInForm.guests)}
                    className="bg-slate-50"
                  />
                )}
                {walkInType === 'package' ? (
                  <SelectField
                    label="Event type"
                    value={walkInForm.eventType}
                    onChange={(event) => setWalkInField('eventType', event.target.value as EventType)}
                    options={eventTypeOptions.map((eventType) => ({ label: eventType, value: eventType }))}
                  />
                ) : null}
                <SelectField
                  label="Payment method"
                  value={walkInPaymentMethod}
                  onChange={(event) => {
                    setWalkInPaymentMethod(event.target.value);
                    if (event.target.value === 'Cash') {
                      setWalkInPaymentReference('');
                    }
                  }}
                  options={[
                    { label: 'Cash', value: 'Cash' },
                    { label: 'GCash', value: 'GCash' },
                    { label: 'Bank transfer', value: 'Bank transfer' },
                  ]}
                />
                <SelectField
                  label="Payment type"
                  value={walkInPaymentType}
                  onChange={(event) => setWalkInPaymentType(event.target.value as 'down-payment' | 'full-payment')}
                  options={[
                    { label: '30% down payment', value: 'down-payment' },
                    { label: 'Fully paid', value: 'full-payment' },
                  ]}
                />
                {walkInNeedsPaymentReference ? (
                  <InputField
                    label="Payment reference number"
                    value={walkInPaymentReference}
                    onChange={(event) => setWalkInPaymentReference(event.target.value)}
                    placeholder="Transaction/reference no."
                  />
                ) : null}
                <InputField
                  label={walkInType === 'room' ? 'Check-in' : 'Date'}
                  type="date"
                  min={todayKey}
                  value={walkInForm.date}
                  onChange={(event) => handleWalkInDateChange(event.target.value)}
                />
                {walkInType === 'room' ? (
                  <>
                    <InputField
                      label="Check-out"
                      type="date"
                      min={addDaysKey(walkInForm.date, 1)}
                      value={walkInCheckOutDate}
                      onChange={(event) => setWalkInCheckOutDate(event.target.value <= walkInForm.date ? addDaysKey(walkInForm.date, 1) : event.target.value)}
                    />
                    <div className="rounded-xl border border-[#dbeafe] bg-[#f8fbff] px-4 py-3 text-xs text-slate-600 md:col-span-2">
                      <p className="font-semibold text-ink">Check-in time: 2:00 PM</p>
                      <p className="mt-1 font-semibold text-ink">Check-out time: 12:00 NN</p>
                    </div>
                  </>
                ) : null}
                {walkInType !== 'room' ? (
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                    <span>Slot</span>
                    <select
                      value={walkInForm.timeSlotId}
                      onChange={(event) => {
                        const nextSlot = baseTimeSlots.find((slot) => slot.id === event.target.value);
                        setWalkInForm((current) => ({
                          ...current,
                          timeSlotId: event.target.value,
                          preferredStartTime: nextSlot?.start ?? current.preferredStartTime,
                        }));
                      }}
                      className="interactive-ring rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink"
                    >
                      {baseTimeSlots.map((slot) => {
                        const status = getSlotStatus(walkInForm.venueId, walkInForm.date, slot.id);

                        return (
                          <option key={slot.id} value={slot.id} disabled={status !== 'available'}>
                            {slot.label}{status !== 'available' ? ` - ${status}` : ''}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                ) : null}
                {walkInType === 'package' ? (
                  <InputField
                    label="Preferred start time"
                    type="time"
                    min={selectedWalkInSlot?.start}
                    max={selectedWalkInSlot?.end}
                    value={walkInPreferredStartTime}
                    onChange={(event) => setWalkInField('preferredStartTime', event.target.value)}
                    hint={`Within ${selectedWalkInSlot?.label ?? 'selected slot'}`}
                  />
                ) : null}
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-lg border border-[#e9dfcc] bg-white p-3 shadow-card lg:sticky lg:top-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
            <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#005fb8]">Summary</p>
            <h3 className="mt-1 text-base font-bold text-ink">Walk-in total</h3>
            <div className="mt-3 rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between gap-3">
                <span>Type</span>
                <span className="font-bold capitalize text-ink">{walkInType === 'pool' ? 'Pool use' : walkInType}</span>
              </div>
              <div className="mt-2 flex items-start justify-between gap-3">
                <span>Selected</span>
                <span className="text-right font-bold text-ink">
                  {walkInType === 'package'
                    ? selectedWalkInPackage?.name ?? 'Package'
                    : walkInType === 'room'
                      ? selectedWalkInRoomLabel || 'Select rooms'
                      : 'Pool use only'}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <span>{walkInType === 'room' ? 'Check-in' : 'Date'}</span>
                <span className="font-bold text-ink">{formatCompactDate(walkInForm.date)}</span>
              </div>
              {walkInType === 'room' ? (
                <>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>Check-out</span>
                    <span className="font-bold text-ink">{formatCompactDate(walkInCheckOutDate)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>Included</span>
                    <span className="font-bold text-ink">{selectedWalkInRoomGuestRange.included} guests</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>Guests</span>
                    <span className="font-bold text-ink">{walkInForm.guests}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>Time</span>
                    <span className="text-right font-bold text-ink">2:00 PM - 12:00 NN</span>
                  </div>
                </>
              ) : null}
              {walkInType === 'package' ? (
                <>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>Guests</span>
                    <span className="font-bold text-ink">{walkInForm.guests}</span>
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <span>Slot</span>
                    <span className="text-right font-bold text-ink">{selectedWalkInSlot?.label}</span>
                  </div>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <span>Preferred start</span>
                    <span className="text-right font-bold text-ink">{formatTimeLabel(walkInPreferredStartTime)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span>Status</span>
                    <span className={`font-bold ${selectedWalkInSlotStatus === 'available' ? walkInPaymentType === 'full-payment' ? 'text-emerald-700' : 'text-amber-700' : 'text-rose-700'}`}>
                      {selectedWalkInSlotStatus === 'available' ? walkInPaymentType === 'full-payment' ? 'fully paid' : 'partial payment' : selectedWalkInSlotStatus}
                    </span>
                  </div>
                </>
              ) : null}
              {selectedWalkInRoomUnavailable ? (
                <p className="mt-2 rounded-lg bg-rose-50 px-3 py-2 font-semibold text-rose-700">Room unavailable.</p>
              ) : null}
            </div>

            <div className="mt-3 rounded-lg bg-[#f7f7f7] p-2.5 text-xs text-slate-600">
              <div className="flex justify-between gap-3">
                <span>
                  {walkInType === 'package'
                    ? selectedWalkInPackage?.name ?? 'Package'
                    : walkInType === 'room'
                      ? `${selectedWalkInRooms.length} room${selectedWalkInRooms.length === 1 ? '' : 's'} total`
                      : 'Pool table charge'}
                </span>
                <span className="font-bold text-ink">{formatCurrency(walkInBaseTotal)}</span>
              </div>
              {walkInType === 'room' ? (
                <>
                  <div className="mt-2 flex justify-between gap-3">
                    <span>Nightly rate</span>
                    <span className="font-bold text-ink">{formatCurrency(selectedWalkInRoomNightlyTotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span>Nights</span>
                    <span className="font-bold text-ink">{walkInRoomNights}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span>
                      Extra bed over {selectedWalkInRoomGuestRange.included}{' '}
                      {walkInExtraBeds > 0 ? `(${walkInExtraBeds} x ${formatCurrency(roomAdditionalGuestRate)})` : '(not added)'}
                    </span>
                    <span className="font-bold text-ink">{formatCurrency(walkInAdditionalGuestTotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span>Extra hours ({walkInAdditionalHours} x {formatCurrency(roomAdditionalHourRate)})</span>
                    <span className="font-bold text-ink">{formatCurrency(walkInAdditionalHoursTotal)}</span>
                  </div>
                </>
              ) : null}
              {walkInType !== 'room' ? (
                <>
                  <div className="mt-2 flex justify-between gap-3">
                    <span>Extra kids ({walkInExtraKidGuests} x {formatCurrency(walkInSelectedExtraGuestRates.kids)})</span>
                    <span className="font-bold text-ink">{formatCurrency(walkInExtraKidGuestTotal)}</span>
                  </div>
                  <div className="mt-2 flex justify-between gap-3">
                    <span>Extra adults ({walkInExtraAdultGuests} x {formatCurrency(walkInSelectedExtraGuestRates.adults)})</span>
                    <span className="font-bold text-ink">{formatCurrency(walkInExtraAdultGuestTotal)}</span>
                  </div>
                </>
              ) : null}
              {canAddWalkInAddOns ? (
                <div className="mt-2 flex justify-between gap-3">
                  <span>Add-ons</span>
                  <span className="font-bold text-ink">{formatCurrency(walkInAddOnsTotal)}</span>
                </div>
              ) : null}
              {selectedWalkInAddOnDetails.length > 0 ? (
                <div className="mt-2 space-y-1 rounded-lg bg-white px-3 py-2">
                  {selectedWalkInAddOnDetails.map((addOn) => (
                    <div key={addOn.name} className="flex items-start justify-between gap-3">
                      <span>{addOn.name}</span>
                      <span className="font-bold text-ink">{formatCurrency(addOn.price)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-amber-800">
                <div className="flex justify-between gap-3">
                  <span>Payment method</span>
                  <span className="font-bold">{walkInPaymentMethod}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span>{walkInPaymentType === 'full-payment' ? 'Amount paid' : '30% down payment'}</span>
                  <span className="font-bold">{formatCurrency(walkInPaidAmount)}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3">
                  <span>Balance</span>
                  <span className="font-bold">{formatCurrency(walkInBalance)}</span>
                </div>
                {walkInNeedsPaymentReference ? (
                  <div className="mt-2 flex justify-between gap-3">
                    <span>Reference no.</span>
                    <span className="text-right font-bold">{walkInPaymentReference.trim() || 'Required'}</span>
                  </div>
                ) : null}
              </div>
              <div className="mt-2 border-t border-slate-200 pt-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-ink">Payment total</span>
                  <span className="text-lg font-extrabold text-[#005fb8]">{formatCurrency(walkInTotal)}</span>
                </div>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              {walkInError ? (
                <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700" role="alert">
                  {walkInError}
                </p>
              ) : null}
              <Button onClick={handleCreateWalkIn} disabled={!canCreateWalkIn || isCreatingWalkIn}>
                {isCreatingWalkIn ? 'Saving...' : 'Save walk-in'}
              </Button>
              <Button variant="ghost" onClick={() => setIsWalkInOpen(false)}>
                Cancel
              </Button>
            </div>
          </aside>
        </div>
      </Modal>
    </div>
  );
}
