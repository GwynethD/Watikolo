import { useMemo, useState } from 'react';
import { Eye, XCircle } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAppData } from '@/context/AppDataContext';
import { formatCompactDate, formatCurrency } from '@/utils/format';

export function ManageBookingsPage() {
  const { bookings, updateBookingStatus } = useAppData();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isRejectOpen, setIsRejectOpen] = useState(false);

  const selectedBooking = bookings.find((booking) => booking.id === selectedBookingId) ?? null;
  const filteredBookings = useMemo(
    () => bookings.filter((booking) => selectedStatus === 'all' || booking.status === selectedStatus),
    [bookings, selectedStatus],
  );

  const handleStatusUpdate = async (status: 'approved' | 'completed' | 'cancelled' | 'rejected') => {
    if (!selectedBookingId) {
      return;
    }

    await updateBookingStatus(selectedBookingId, status);
    if (status === 'rejected') {
      setIsRejectOpen(false);
    }
    setSelectedBookingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-ink">Manage bookings</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600">Review requests, inspect booking details, and move them through a persistent approval workflow.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'completed', 'cancelled', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${selectedStatus === status ? 'bg-ink text-white' : 'bg-white text-slate-600 shadow-card'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      <DataTable
        data={filteredBookings}
        columns={[
          { key: 'reference', label: 'Reference', render: (row) => <div><p className="font-semibold text-ink">{row.reference}</p><p className="text-xs text-slate-500">{row.venueName}</p></div> },
          { key: 'customer', label: 'Customer', render: (row) => <div><p>{row.customerName}</p><p className="text-xs text-slate-500">{row.customerEmail}</p><p className="text-xs text-slate-400">{row.customerPhone ?? 'No phone saved'}</p></div> },
          { key: 'schedule', label: 'Schedule', render: (row) => <div><p>{formatCompactDate(row.date)}</p><p className="text-xs text-slate-500">{row.timeSlotLabel}</p></div> },
          { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.totalPrice) },
          { key: 'status', label: 'Status', render: (row) => <StatusBadge status={row.status} /> },
          {
            key: 'actions',
            label: 'Actions',
            render: (row) => (
              <div className="flex gap-2">
                <button onClick={() => setSelectedBookingId(row.id)} className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"><Eye className="h-4 w-4" /></button>
                <button onClick={() => { setSelectedBookingId(row.id); setIsRejectOpen(true); }} className="rounded-full bg-rose-50 p-2 text-rose-600 hover:bg-rose-100"><XCircle className="h-4 w-4" /></button>
              </div>
            ),
          },
        ]}
      />

      <Drawer open={Boolean(selectedBooking)} onClose={() => setSelectedBookingId(null)} title="Booking details">
        {selectedBooking ? (
          <div className="space-y-4 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">Reference</p><p className="mt-2 font-semibold text-ink">{selectedBooking.reference}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">Client</p><p className="mt-2 font-semibold text-ink">{selectedBooking.customerName}</p><p>{selectedBooking.customerEmail}</p><p>{selectedBooking.customerPhone ?? 'No phone saved'}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">Schedule</p><p className="mt-2 font-semibold text-ink">{formatCompactDate(selectedBooking.date)}</p><p>{selectedBooking.timeSlotLabel}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-slate-400">Notes</p><p className="mt-2">{selectedBooking.notes ?? 'No special notes submitted.'}</p></div>
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => handleStatusUpdate('approved')}>Approve</Button>
              <Button variant="ghost" onClick={() => handleStatusUpdate('completed')}>Mark completed</Button>
              <Button variant="danger" onClick={() => handleStatusUpdate('cancelled')}>Cancel</Button>
              <Button variant="ghost" onClick={() => { setIsRejectOpen(true); }}>Reject</Button>
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
    </div>
  );
}
