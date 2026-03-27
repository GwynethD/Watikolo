import { useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField, TextAreaField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppData } from '@/context/AppDataContext';
import type { EventType, Venue, VenueDraft, VenueType } from '@/types';
import { formatCurrency } from '@/utils/format';

const venueTypes: VenueType[] = ['Ballroom', 'Garden', 'Conference Hall', 'Rooftop', 'Private Hall'];
const eventTypeOptions: EventType[] = ['Wedding', 'Corporate', 'Birthday', 'Debut', 'Conference', 'Other'];
const availabilityOptions: Venue['availability'][] = ['Open this week', 'Limited availability', 'Peak season'];

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

export function ManageVenuesPage() {
  const { venues, removeVenue, saveVenue } = useAppData();
  const [query, setQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);
  const [form, setForm] = useState<VenueFormState>(emptyForm);

  const filteredVenues = useMemo(
    () => venues.filter((venue) => [venue.name, venue.location, venue.type].join(' ').toLowerCase().includes(query.toLowerCase())),
    [query, venues],
  );

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

  const setField = (field: keyof VenueFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    await saveVenue(toDraft(form), editingVenueId ?? undefined);
    setIsModalOpen(false);
    setEditingVenueId(null);
    setForm(emptyForm);
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-ink">Manage venues</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Create, edit, and remove venue inventory while keeping the public listings in sync.</p>
          </div>
          <Button variant="secondary" className="gap-2" onClick={openCreateModal}><Plus className="h-4 w-4" />Add venue</Button>
        </div>
        <label className="relative mt-6 block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search venues" className="interactive-ring w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm" />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredVenues.map((venue) => (
          <div key={venue.id} className="panel overflow-hidden">
            <img src={venue.heroImage} alt={venue.name} className="h-48 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-gold-600">{venue.type}</p>
                  <h2 className="mt-2 text-2xl font-semibold text-ink">{venue.name}</h2>
                </div>
                <StatusBadge status={venue.availability} />
              </div>
              <div className="mt-5 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">{venue.location}</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">{venue.capacity} guests</div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">{formatCurrency(venue.price)}</div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">{venue.shortDescription}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="ghost" className="gap-2" onClick={() => openEditModal(venue)}><Pencil className="h-4 w-4" />Edit</Button>
                <Button variant="danger" className="gap-2" onClick={() => void removeVenue(venue.id)}><Trash2 className="h-4 w-4" />Delete</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVenueId ? 'Edit venue' : 'Add venue'} className="max-w-4xl">
        <div className="grid gap-5 md:grid-cols-2">
          <InputField label="Venue name" value={form.name} onChange={(event) => setField('name', event.target.value)} />
          <SelectField label="Venue type" value={form.type} onChange={(event) => setField('type', event.target.value)} options={venueTypes.map((type) => ({ label: type, value: type }))} />
          <InputField label="Location" value={form.location} onChange={(event) => setField('location', event.target.value)} />
          <InputField label="Price" type="number" value={form.price} onChange={(event) => setField('price', event.target.value)} />
          <InputField label="Capacity" type="number" value={form.capacity} onChange={(event) => setField('capacity', event.target.value)} />
          <SelectField label="Availability" value={form.availability} onChange={(event) => setField('availability', event.target.value)} options={availabilityOptions.map((item) => ({ label: item, value: item }))} />
          <InputField label="Availability text" value={form.availabilityText} onChange={(event) => setField('availabilityText', event.target.value)} />
          <SelectField label="Featured" value={form.featured} onChange={(event) => setField('featured', event.target.value)} options={[{ label: 'No', value: 'false' }, { label: 'Yes', value: 'true' }]} />
          <div className="md:col-span-2">
            <InputField label="Hero image URL" value={form.heroImage} onChange={(event) => setField('heroImage', event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <InputField label="Gallery URLs" hint="Separate multiple URLs with commas" value={form.gallery} onChange={(event) => setField('gallery', event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <TextAreaField label="Short description" value={form.shortDescription} onChange={(event) => setField('shortDescription', event.target.value)} />
          </div>
          <div className="md:col-span-2">
            <TextAreaField label="Full description" value={form.description} onChange={(event) => setField('description', event.target.value)} />
          </div>
          <InputField label="Amenities" hint="Separate with commas" value={form.amenities} onChange={(event) => setField('amenities', event.target.value)} />
          <InputField label="Supported event types" hint="Use the available event type labels" value={form.eventTypes} onChange={(event) => setField('eventTypes', event.target.value)} />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Close</Button>
          <Button variant="secondary" onClick={() => void handleSave()}>{editingVenueId ? 'Save changes' : 'Create venue'}</Button>
        </div>
      </Modal>
    </div>
  );
}
