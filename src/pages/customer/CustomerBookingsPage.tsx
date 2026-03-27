import { useState } from 'react';
import { CalendarX2 } from 'lucide-react';
import { BookingCard } from '@/components/booking/BookingCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Tabs } from '@/components/ui/Tabs';
import { DEMO_CUSTOMER } from '@/constants/demo';
import { useAppData } from '@/context/AppDataContext';

export function CustomerBookingsPage() {
  const { bookings } = useAppData();
  const [activeTab, setActiveTab] = useState('all');
  const customerBookings = bookings.filter((booking) => booking.customerEmail === DEMO_CUSTOMER.email);
  const filteredBookings = customerBookings.filter((booking) => activeTab === 'all' || booking.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <h1 className="text-3xl font-semibold text-ink">My bookings</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">View all your requests, approvals, completed reservations, and cancellations in one place.</p>
        <div className="mt-6">
          <Tabs
            activeValue={activeTab}
            onChange={setActiveTab}
            items={[
              { label: 'All', value: 'all' },
              { label: 'Pending', value: 'pending' },
              { label: 'Approved', value: 'approved' },
              { label: 'Completed', value: 'completed' },
              { label: 'Cancelled', value: 'cancelled' },
            ]}
          />
        </div>
      </div>

      {filteredBookings.length > 0 ? (
        <div className="grid gap-4">
          {filteredBookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarX2 className="h-8 w-8" />}
          title="No bookings in this tab"
          description="Once new requests are added or approved, they will appear here with their current booking status."
        />
      )}
    </div>
  );
}
