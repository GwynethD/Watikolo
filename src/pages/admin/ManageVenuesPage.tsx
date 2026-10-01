import { useMemo, useState } from 'react';
import { Ban, Bed, CheckCircle2, Clock3, Gift, Pencil, Plus, Trash2, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InputField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { useAppData } from '@/context/AppDataContext';
import type { AccommodationPackage } from '@/mock/accommodationPackages';
import type { AccommodationRoom } from '@/mock/accommodationRooms';
import type { AdditionalAddOn } from '@/mock/additionalAddOns';
import type { EventType, Venue, VenueDraft, VenueType } from '@/types';
import { formatCurrency, formatRoomCapacityLabel } from '@/utils/format';

const eventTypeOptions: EventType[] = ['Wedding', 'Corporate', 'Birthday', 'Debut', 'Conference', 'Other'];
const managementTabs = ['venues', 'packages', 'rooms', 'add-ons'] as const;

type ManagementTab = typeof managementTabs[number];

interface VenueFormState {
  name: string;
  type: VenueType;
  location: string;
  price: string;
  capacity: string;
  shortDescription: string;
  description: string;
  amenities: string;
  eventTypes: string;
  heroImage: string;
  gallery: string;
  availabilityText: string;
  availability: Venue['availability'];
  featured: string;
}

interface PackageFormState {
  name: string;
  price: string;
  minGuests: string;
  guestLabel: string;
  inclusions: string;
}

interface RoomFormState {
  name: string;
  price: string;
  capacity: string;
  image: string;
  inclusions: string;
  details: string;
}

interface AddOnFormState {
  name: string;
  price: string;
  description: string;
}

const emptyForm: VenueFormState = {
  name: '',
  type: 'Ballroom',
  location: '',
  price: '50000',
  capacity: '120',
  shortDescription: '',
  description: '',
  amenities: 'Parking area, Sound system, Guest lounge',
  eventTypes: 'Wedding, Birthday',
  heroImage: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  gallery: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
  availabilityText: 'Open for reservations',
  availability: 'Open this week',
  featured: 'false',
};

const emptyPackageForm: PackageFormState = {
  name: '',
  price: '5000',
  minGuests: '30',
  guestLabel: 'Good for 30 guests',
  inclusions: 'Pool access, Tables and chairs, Parking area',
};

const emptyRoomForm: RoomFormState = {
  name: '',
  price: '1900',
  capacity: 'Good for 2 Guests',
  image: '',
  inclusions: 'Air conditioning, Private bathroom, Free WiFi',
  details: '',
};

const emptyAddOnForm: AddOnFormState = {
  name: '',
  price: '1500',
  description: '',
};

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function toFormState(venue: Venue): VenueFormState {
  return {
    name: venue.name,
    type: venue.type,
    location: venue.location,
    price: String(venue.price),
    capacity: String(venue.capacity),
    shortDescription: venue.shortDescription,
    description: venue.description,
    amenities: venue.amenities.join(', '),
    eventTypes: venue.eventTypes.join(', '),
    heroImage: venue.heroImage,
    gallery: venue.gallery.join(', '),
    availabilityText: venue.availabilityText,
    availability: venue.availability,
    featured: String(Boolean(venue.featured)),
  };
}

function toDraft(form: VenueFormState): VenueDraft {
  const selectedEventTypes = form.eventTypes
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is EventType => eventTypeOptions.includes(item as EventType));

  return {
    name: form.name,
    type: form.type,
    location: form.location,
    price: Number(form.price),
    capacity: Number(form.capacity),
    shortDescription: form.shortDescription,
    description: form.description,
    amenities: form.amenities.split(',').map((item) => item.trim()).filter(Boolean),
    eventTypes: selectedEventTypes.length > 0 ? selectedEventTypes : ['Other'],
    heroImage: form.heroImage,
    gallery: form.gallery.split(',').map((item) => item.trim()).filter(Boolean),
    availabilityText: form.availabilityText,
    availability: form.availability,
    featured: form.featured === 'true',
  };
}

function toPackageFormState(item: AccommodationPackage): PackageFormState {
  return {
    name: item.name,
    price: String(item.price),
    minGuests: String(item.minGuests),
    guestLabel: item.guestLabel,
    inclusions: item.inclusions.join(', '),
  };
}

function toRoomFormState(item: AccommodationRoom): RoomFormState {
  const details = item.inclusions.find((inclusion) => inclusion.startsWith('Details: '))?.replace('Details: ', '') ?? '';

  return {
    name: item.name,
    price: String(item.price),
    capacity: item.capacity,
    image: item.image,
    inclusions: item.inclusions.filter((inclusion) => !inclusion.startsWith('Details: ')).join(', '),
    details,
  };
}

function toAddOnFormState(item: AdditionalAddOn): AddOnFormState {
  return {
    name: item.name,
    price: String(item.price),
    description: item.description,
  };
}

function getPackageGuestCapacity(item: AccommodationPackage) {
  const labelCapacity = item.guestLabel.match(/\d+/)?.[0];

  return Number(labelCapacity ?? item.minGuests) || 0;
}

function createRoomId(rooms: AccommodationRoom[]) {
  const nextNumber = rooms.reduce((highest, room) => Math.max(highest, Number(room.id?.match(/^room-(\d+)$/)?.[1] ?? 0)), 0) + 1;

  return `room-${nextNumber}`;
}

export function ManageVenuesPage() {
  const { bookings, venues, packages, rooms, addOns, removeVenue, saveVenue, savePackages, saveRooms, saveAddOns } = useAppData();
  const adminVenues = useMemo(() => venues.slice(0, 3), [venues]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isAddOnModalOpen, setIsAddOnModalOpen] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [editingPackageIndex, setEditingPackageIndex] = useState<number | null>(null);
  const [editingRoomIndex, setEditingRoomIndex] = useState<number | null>(null);
  const [editingAddOnIndex, setEditingAddOnIndex] = useState<number | null>(null);
  const [form, setForm] = useState<VenueFormState>(emptyForm);
  const [packageForm, setPackageForm] = useState<PackageFormState>(emptyPackageForm);
  const [roomForm, setRoomForm] = useState<RoomFormState>(emptyRoomForm);
  const [addOnForm, setAddOnForm] = useState<AddOnFormState>(emptyAddOnForm);
  const [isSavingAddOn, setIsSavingAddOn] = useState(false);
  const [activeTab, setActiveTab] = useState<ManagementTab>('venues');
  const todayKey = new Date().toISOString().slice(0, 10);
  const occupiedRoomCount = useMemo(() => {
    const activeRoomNames = new Set<string>();

    bookings
      .filter((booking) => booking.date === todayKey && !['cancelled', 'rejected'].includes(booking.status))
      .forEach((booking) => {
        if (booking.bookingMode === 'room' && booking.packageName) {
          activeRoomNames.add(booking.packageName);
        }

        booking.roomAddOns?.forEach((roomName) => activeRoomNames.add(roomName));
      });

    return Math.min(activeRoomNames.size, rooms.length);
  }, [bookings, rooms.length, todayKey]);
  const maintenanceRoomCount = 0;
  const availableRoomCount = Math.max(rooms.length - occupiedRoomCount, 0);
  const bookedPackageCount = useMemo(() => {
    const activePackageNames = new Set<string>();

    bookings
      .filter((booking) => booking.date === todayKey && booking.bookingMode !== 'room' && !['cancelled', 'rejected'].includes(booking.status))
      .forEach((booking) => {
        if (booking.packageName && booking.packageName !== 'Pool use only') {
          activePackageNames.add(booking.packageName);
        }
      });

    return Math.min(activePackageNames.size, packages.length);
  }, [bookings, packages.length, todayKey]);
  const availablePackageCount = Math.max(packages.length - bookedPackageCount, 0);
  const totalPackageGuestCapacity = packages.reduce((total, item) => total + getPackageGuestCapacity(item), 0);

  const openCreateModal = () => {
    setEditingVenueId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (venue: Venue) => {
    setEditingVenueId(venue.id);
    setForm(toFormState(venue));
    setIsModalOpen(true);
  };

  const openPackageModal = () => {
    setEditingPackageIndex(null);
    setPackageForm(emptyPackageForm);
    setIsPackageModalOpen(true);
  };

  const openEditPackageModal = (item: AccommodationPackage, index: number) => {
    setEditingPackageIndex(index);
    setPackageForm(toPackageFormState(item));
    setIsPackageModalOpen(true);
  };

  const openRoomModal = () => {
    setEditingRoomIndex(null);
    setRoomForm(emptyRoomForm);
    setIsRoomModalOpen(true);
  };

  const openEditRoomModal = (item: AccommodationRoom, index: number) => {
    setEditingRoomIndex(index);
    setRoomForm(toRoomFormState(item));
    setIsRoomModalOpen(true);
  };

  const openAddOnModal = () => {
    setEditingAddOnIndex(null);
    setAddOnForm(emptyAddOnForm);
    setIsAddOnModalOpen(true);
  };

  const openEditAddOnModal = (item: AdditionalAddOn, index: number) => {
    setEditingAddOnIndex(index);
    setAddOnForm(toAddOnFormState(item));
    setIsAddOnModalOpen(true);
  };

  const setField = (field: keyof VenueFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const setPackageField = (field: keyof PackageFormState, value: string) => {
    setPackageForm((current) => ({ ...current, [field]: value }));
  };

  const setRoomField = (field: keyof RoomFormState, value: string) => {
    setRoomForm((current) => ({ ...current, [field]: value }));
  };

  const setAddOnField = (field: keyof AddOnFormState, value: string) => {
    setAddOnForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    await saveVenue(toDraft(form), editingVenueId ?? undefined);
    setIsModalOpen(false);
    setEditingVenueId(null);
    setForm(emptyForm);
  };

  const handleSavePackage = () => {
    if (!packageForm.name.trim()) {
      return;
    }

    const savedPackage: AccommodationPackage = {
      name: packageForm.name.trim(),
      price: Number(packageForm.price) || 0,
      minGuests: Number(packageForm.minGuests) || 1,
      guestLabel: packageForm.guestLabel.trim() || `Good for ${packageForm.minGuests || 1} guests`,
      isExclusive: editingPackageIndex === null ? false : packages[editingPackageIndex]?.isExclusive ?? false,
      inclusions: splitList(packageForm.inclusions),
    };
    const nextPackages = editingPackageIndex === null
      ? [...packages, savedPackage]
      : packages.map((item, index) => (index === editingPackageIndex ? savedPackage : item));
    void savePackages(nextPackages);
    setPackageForm(emptyPackageForm);
    setEditingPackageIndex(null);
    setIsPackageModalOpen(false);
  };

  const handleSaveRoom = () => {
    if (!roomForm.name.trim()) {
      return;
    }

    const savedRoom: AccommodationRoom = {
      id: editingRoomIndex === null ? createRoomId(rooms) : rooms[editingRoomIndex]?.id ?? createRoomId(rooms),
      name: roomForm.name.trim(),
      price: Number(roomForm.price) || 0,
      capacity: roomForm.capacity.trim() || 'Room capacity not set',
      image: roomForm.image.trim() || rooms[0]?.image || '',
      inclusions: [...splitList(roomForm.inclusions), ...(roomForm.details.trim() ? [`Details: ${roomForm.details.trim()}`] : [])],
    };
    const nextRooms = editingRoomIndex === null
      ? [...rooms, savedRoom]
      : rooms.map((item, index) => (index === editingRoomIndex ? savedRoom : item));
    void saveRooms(nextRooms);
    setRoomForm(emptyRoomForm);
    setEditingRoomIndex(null);
    setIsRoomModalOpen(false);
  };

  const handleSaveAddOn = async () => {
    if (!addOnForm.name.trim()) {
      return;
    }

    setIsSavingAddOn(true);
    const savedAddOn: AdditionalAddOn = {
      name: addOnForm.name.trim(),
      price: Number(addOnForm.price) || 0,
      description: addOnForm.description.trim() || 'Additional booking add-on.',
    };
    const nextAddOns = editingAddOnIndex === null
      ? [...addOns, savedAddOn]
      : addOns.map((item, index) => (index === editingAddOnIndex ? savedAddOn : item));

    try {
      await saveAddOns(nextAddOns);
      setAddOnForm(emptyAddOnForm);
      setEditingAddOnIndex(null);
      setIsAddOnModalOpen(false);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to save add-on changes.');
    } finally {
      setIsSavingAddOn(false);
    }
  };

  const handleDeleteVenue = async (venue: Venue) => {
    const shouldDelete = window.confirm(`Delete ${venue.name}? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    await removeVenue(venue.id);
  };

  const handleDeletePackage = (index: number) => {
    const item = packages[index];
    const shouldDelete = window.confirm(`Delete ${item?.name ?? 'this package'}? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    void savePackages(packages.filter((_, itemIndex) => itemIndex !== index));
    if (editingPackageIndex === index) {
      setEditingPackageIndex(null);
      setIsPackageModalOpen(false);
    }
  };

  const handleDeleteRoom = (index: number) => {
    const item = rooms[index];
    const shouldDelete = window.confirm(`Delete ${item?.name ?? 'this room'}? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    void saveRooms(rooms.filter((_, itemIndex) => itemIndex !== index));
    if (editingRoomIndex === index) {
      setEditingRoomIndex(null);
      setIsRoomModalOpen(false);
    }
  };

  const handleDeleteAddOn = (index: number) => {
    const item = addOns[index];
    const shouldDelete = window.confirm(`Delete ${item?.name ?? 'this add-on'}? This cannot be undone.`);
    if (!shouldDelete) {
      return;
    }

    void saveAddOns(addOns.filter((_, itemIndex) => itemIndex !== index));
    if (editingAddOnIndex === index) {
      setEditingAddOnIndex(null);
      setIsAddOnModalOpen(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="panel p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-ink sm:text-3xl">Venue Management</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:leading-7">Manage venues, packages, rooms, rates, and optional booking add-ons.</p>
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Rate changes apply to new bookings only. Existing booking records keep their saved total pricing.
            </p>
          </div>
          <Button
            className="w-full gap-2 sm:w-auto"
            onClick={
              activeTab === 'packages'
                ? openPackageModal
                : activeTab === 'rooms'
                  ? openRoomModal
                  : activeTab === 'add-ons'
                    ? openAddOnModal
                    : openCreateModal
            }
          >
            <Plus className="h-4 w-4" />
            {activeTab === 'packages' ? 'Add package' : activeTab === 'rooms' ? 'Add room' : activeTab === 'add-ons' ? 'Add add-on' : 'Add venue'}
          </Button>
        </div>

        <div className="mt-4 flex max-w-full flex-nowrap gap-2 overflow-x-auto pb-1 sm:mt-5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {managementTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold capitalize transition ${
                activeTab === tab ? 'bg-[#005fb8] text-white shadow-card' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'venues' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {adminVenues.map((venue) => (
            <div key={venue.id} className="panel overflow-hidden">
              <img src={venue.heroImage} alt={venue.name} className="h-32 w-full object-cover" />
              <div className="p-3">
                <div className="flex min-h-6 flex-col justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gold-600">{venue.name}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="ghost" className="gap-2 px-3 py-2 text-xs" onClick={() => openEditModal(venue)}><Pencil className="h-4 w-4" />Edit</Button>
                  <Button variant="danger" className="gap-2 px-3 py-2 text-xs" onClick={() => void handleDeleteVenue(venue)}><Trash2 className="h-4 w-4" />Delete</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === 'packages' ? (
        <div className="rounded-[18px] border border-white/80 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Packages', value: packages.length, icon: Gift, className: 'border-emerald-100 bg-emerald-50/30 text-emerald-700' },
              { label: 'Active Packages', value: availablePackageCount, icon: CheckCircle2, className: 'border-emerald-100 bg-emerald-50/20 text-emerald-700' },
              { label: 'Inactive Packages', value: bookedPackageCount, icon: Clock3, className: 'border-amber-100 bg-amber-50/40 text-amber-700' },
              { label: 'Total Guest Capacity', value: totalPackageGuestCapacity, icon: UsersRound, className: 'border-emerald-100 bg-emerald-50/20 text-emerald-700' },
            ].map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.label} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${card.className}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/70"><Icon className="h-4 w-4" /></span>
                  <div>
                    <p className="text-[10px] font-semibold leading-tight text-slate-600">{card.label}</p>
                    <p className="text-sm font-bold leading-tight text-ink">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <p className="text-sm font-bold text-ink">Packages</p>
            <p className="mt-1 text-xs text-slate-500">Rates and inclusions</p>
          </div>
          <div className="mt-3 grid gap-2">
            {packages.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center gap-2">
                <button type="button" onClick={() => openEditPackageModal(item, index)} className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-left text-xs ring-1 ring-slate-100 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-300">
                  <span className="min-w-0 truncate font-semibold text-slate-700">{item.name}</span>
                  <span className="shrink-0 font-bold text-[#0f4da0]">{formatCurrency(item.price)}</span>
                </button>
                <button type="button" aria-label={`Delete ${item.name}`} title="Delete" onClick={() => handleDeletePackage(index)} className="interactive-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'rooms' ? (
        <div className="rounded-[18px] border border-white/80 bg-white p-4 shadow-card sm:p-5">
          <div className="mb-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Total Rooms', value: rooms.length, icon: Bed, className: 'border-emerald-100 bg-emerald-50/30 text-emerald-700' },
              { label: 'Available', value: availableRoomCount, icon: CheckCircle2, className: 'border-emerald-100 bg-emerald-50/20 text-emerald-700' },
              { label: 'Occupied', value: occupiedRoomCount, icon: Clock3, className: 'border-amber-100 bg-amber-50/40 text-amber-700' },
              { label: 'Maintenance', value: maintenanceRoomCount, icon: Ban, className: 'border-rose-100 bg-rose-50/40 text-rose-700' },
            ].map((card) => {
              const Icon = card.icon;

              return (
                <div key={card.label} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${card.className}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/70"><Icon className="h-4 w-4" /></span>
                  <div>
                    <p className="text-[10px] font-semibold leading-tight text-slate-600">{card.label}</p>
                    <p className="text-sm font-bold leading-tight text-ink">{card.value}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div>
            <p className="text-sm font-bold text-ink">Rooms</p>
            <p className="mt-1 text-xs text-slate-500">Accommodation details</p>
          </div>
          <div className="mt-3 grid gap-2">
            {rooms.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center gap-2">
                <button type="button" onClick={() => openEditRoomModal(item, index)} className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-left text-xs ring-1 ring-slate-100 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-300">
                  <span className="min-w-0 truncate font-semibold text-slate-700">{item.name}</span>
                  <span className="shrink-0 text-slate-500">{formatRoomCapacityLabel(item.name, item.capacity)}</span>
                </button>
                <button type="button" aria-label={`Delete ${item.name}`} title="Delete" onClick={() => handleDeleteRoom(index)} className="interactive-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === 'add-ons' ? (
        <div className="rounded-[18px] border border-white/80 bg-white p-4 shadow-card sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Additional add-ons</h2>
            <p className="mt-1 text-xs text-slate-500">Optional services and booking extras.</p>
          </div>
          <div className="flex gap-2 text-xs font-semibold text-slate-500">
            <span className="rounded-full bg-slate-50 px-3 py-1">{addOns.length} add-ons</span>
          </div>
        </div>

          <div className="mt-4 grid gap-2">
            {addOns.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center gap-2">
                <button type="button" onClick={() => openEditAddOnModal(item, index)} className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-left text-xs ring-1 ring-slate-100 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-300">
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-slate-700">{item.name}</span>
                    <span className="mt-1 block truncate text-slate-400">{item.description}</span>
                  </span>
                  <span className="shrink-0 font-bold text-[#0f4da0]">{formatCurrency(item.price)}</span>
                </button>
                <button type="button" aria-label={`Delete ${item.name}`} title="Delete" onClick={() => handleDeleteAddOn(index)} className="interactive-ring flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600 transition hover:bg-rose-100"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Modal open={isPackageModalOpen} onClose={() => setIsPackageModalOpen(false)} title={editingPackageIndex === null ? 'Add package' : 'Edit package'} className="max-w-3xl">
        <div className="grid gap-3 md:grid-cols-2">
          <InputField label="Package name" className="rounded-xl px-3 py-2" value={packageForm.name} onChange={(event) => setPackageField('name', event.target.value)} />
          <InputField label="Price" className="rounded-xl px-3 py-2" type="number" value={packageForm.price} onChange={(event) => setPackageField('price', event.target.value)} />
          <InputField label="Minimum guests" className="rounded-xl px-3 py-2" type="number" value={packageForm.minGuests} onChange={(event) => setPackageField('minGuests', event.target.value)} />
          <InputField label="Guest label" className="rounded-xl px-3 py-2" value={packageForm.guestLabel} onChange={(event) => setPackageField('guestLabel', event.target.value)} />
          <div className="md:col-span-2">
            <InputField label="Inclusions" hint="Separate multiple inclusions with commas" className="rounded-xl px-3 py-2" value={packageForm.inclusions} onChange={(event) => setPackageField('inclusions', event.target.value)} />
          </div>
        </div>
        <div className="sticky bottom-0 -mx-5 mt-4 flex justify-end gap-3 border-t border-slate-100 bg-white px-5 py-3">
          <Button variant="ghost" onClick={() => setIsPackageModalOpen(false)}>Close</Button>
          <Button variant="secondary" onClick={handleSavePackage}>{editingPackageIndex === null ? 'Create package' : 'Save changes'}</Button>
        </div>
      </Modal>

      <Modal open={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={editingRoomIndex === null ? 'Add room' : 'Edit room'} className="max-w-3xl">
        <div className="grid gap-3 md:grid-cols-2">
          <InputField label="Room name" className="rounded-xl px-3 py-2" value={roomForm.name} onChange={(event) => setRoomField('name', event.target.value)} />
          <InputField label="Price" className="rounded-xl px-3 py-2" type="number" value={roomForm.price} onChange={(event) => setRoomField('price', event.target.value)} />
          <InputField label="Capacity" className="rounded-xl px-3 py-2" value={roomForm.capacity} onChange={(event) => setRoomField('capacity', event.target.value)} />
          <InputField label="Image URL" className="rounded-xl px-3 py-2" value={roomForm.image} onChange={(event) => setRoomField('image', event.target.value)} />
          <div className="md:col-span-2">
            <InputField label="Inclusions" hint="Separate multiple inclusions with commas" className="rounded-xl px-3 py-2" value={roomForm.inclusions} onChange={(event) => setRoomField('inclusions', event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <InputField label="Room details" className="rounded-xl px-3 py-2" value={roomForm.details} onChange={(event) => setRoomField('details', event.target.value)} />
          </div>
        </div>
        <div className="sticky bottom-0 -mx-5 mt-4 flex justify-end gap-3 border-t border-slate-100 bg-white px-5 py-3">
          <Button variant="ghost" onClick={() => setIsRoomModalOpen(false)}>Close</Button>
          <Button variant="secondary" onClick={handleSaveRoom}>{editingRoomIndex === null ? 'Create room' : 'Save changes'}</Button>
        </div>
      </Modal>

      <Modal open={isAddOnModalOpen} onClose={() => setIsAddOnModalOpen(false)} title={editingAddOnIndex === null ? 'Add add-on' : 'Edit add-on'} className="max-w-3xl">
        <div className="grid gap-3 md:grid-cols-2">
          <InputField label="Add-on name" className="rounded-xl px-3 py-2" value={addOnForm.name} onChange={(event) => setAddOnField('name', event.target.value)} />
          <InputField label="Price" className="rounded-xl px-3 py-2" type="number" value={addOnForm.price} onChange={(event) => setAddOnField('price', event.target.value)} />
          <div className="md:col-span-2">
            <InputField label="Description" className="rounded-xl px-3 py-2" value={addOnForm.description} onChange={(event) => setAddOnField('description', event.target.value)} />
          </div>
        </div>
        <div className="sticky bottom-0 -mx-5 mt-4 flex justify-end gap-3 border-t border-slate-100 bg-white px-5 py-3">
          <Button variant="ghost" onClick={() => setIsAddOnModalOpen(false)}>Close</Button>
          <Button variant="secondary" onClick={() => void handleSaveAddOn()} disabled={isSavingAddOn}>
            {isSavingAddOn ? 'Saving...' : editingAddOnIndex === null ? 'Create add-on' : 'Save changes'}
          </Button>
        </div>
      </Modal>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVenueId ? 'Edit venue' : 'Add venue'} className="max-w-4xl">
        <div className="grid gap-3 md:grid-cols-2">
          <InputField label="Venue name" className="rounded-xl px-3 py-2" value={form.name} onChange={(event) => setField('name', event.target.value)} />
          <div className="md:col-span-2">
            <InputField label="Hero image URL" className="rounded-xl px-3 py-2" value={form.heroImage} onChange={(event) => setField('heroImage', event.target.value)} />
          </div>
        </div>
        <div className="sticky bottom-0 -mx-5 mt-4 flex justify-end gap-3 border-t border-slate-100 bg-white px-5 py-3">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
          <Button variant="secondary" onClick={() => void handleSave()}>{editingVenueId ? 'Save changes' : 'Create venue'}</Button>
        </div>
      </Modal>
    </div>
  );
}
