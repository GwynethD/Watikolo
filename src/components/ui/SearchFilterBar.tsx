import { Search } from 'lucide-react';
import type { SearchFilters } from '@/types';
import { InputField, SelectField } from '@/components/ui/FormField';

interface SearchFilterBarProps {
  filters: SearchFilters;
  onChange: (name: keyof SearchFilters, value: string) => void;
}

export function SearchFilterBar({ filters, onChange }: SearchFilterBarProps) {
  return (
    <div className="panel p-5">
      <div className="grid gap-4 lg:grid-cols-5">
        <label className="relative flex flex-col gap-2 text-sm font-medium text-slate-700 lg:col-span-2">
          <span>Search venue</span>
          <Search className="pointer-events-none absolute left-4 top-[42px] h-4 w-4 text-slate-400" />
          <input
            value={filters.query}
            onChange={(event) => onChange('query', event.target.value)}
            placeholder="Search by venue, city, or amenity"
            className="interactive-ring rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm"
          />
        </label>
        <SelectField
          label="Venue type"
          value={filters.venueType}
          onChange={(event) => onChange('venueType', event.target.value)}
          options={[
            { label: 'All types', value: 'all' },
            { label: 'Ballroom', value: 'Ballroom' },
            { label: 'Garden', value: 'Garden' },
            { label: 'Conference Hall', value: 'Conference Hall' },
            { label: 'Rooftop', value: 'Rooftop' },
            { label: 'Private Hall', value: 'Private Hall' },
          ]}
        />
        <SelectField
          label="Availability"
          value={filters.availability}
          onChange={(event) => onChange('availability', event.target.value)}
          options={[
            { label: 'Any availability', value: 'all' },
            { label: 'Open this week', value: 'Open this week' },
            { label: 'Limited availability', value: 'Limited availability' },
            { label: 'Peak season', value: 'Peak season' },
          ]}
        />
        <SelectField
          label="Sort by"
          value={filters.sortBy}
          onChange={(event) => onChange('sortBy', event.target.value)}
          options={[
            { label: 'Featured first', value: 'featured' },
            { label: 'Lowest price', value: 'price-asc' },
            { label: 'Highest price', value: 'price-desc' },
            { label: 'Highest capacity', value: 'capacity-desc' },
          ]}
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <InputField
          label="Minimum capacity"
          type="number"
          min="0"
          value={filters.minCapacity}
          onChange={(event) => onChange('minCapacity', event.target.value)}
          placeholder="100"
        />
        <InputField
          label="Maximum price"
          type="number"
          min="0"
          value={filters.maxPrice}
          onChange={(event) => onChange('maxPrice', event.target.value)}
          placeholder="80000"
        />
      </div>
    </div>
  );
}
