import { useMemo, useState } from 'react';
import { Boxes, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InputField, SelectField } from '@/components/ui/FormField';
import { Modal } from '@/components/ui/Modal';
import { useAppData } from '@/context/AppDataContext';
import type { InventoryItem, InventoryItemType, InventoryStatus, InventoryTransaction, InventoryTransactionReason, StockOutReason } from '@/types';
import { cn } from '@/utils/cn';

interface InventoryFormState {
  room_id: string;
  name: string;
  category: string;
  itemType: InventoryItemType;
  totalQuantity: string;
  availableQuantity: string;
  inUseQuantity: string;
  damagedQuantity: string;
  unit: string;
  reorderLevel: string;
  location: string;
  underMaintenance: boolean;
  notes: string;
}

const emptyForm: InventoryFormState = {
  room_id: '',
  name: '',
  category: 'Housekeeping',
  itemType: 'consumable',
  totalQuantity: '0',
  availableQuantity: '0',
  inUseQuantity: '0',
  damagedQuantity: '0',
  unit: 'pcs',
  reorderLevel: '0',
  location: '',
  underMaintenance: false,
  notes: '',
};
const stockOutReasons: StockOutReason[] = ['Booking/Event', 'Room Use', 'Cleaning', 'Damaged', 'Other'];
const stockInReasons: InventoryTransactionReason[] = ['Restock', 'Supplier Delivery', 'Correction', 'Other'];
const returnReasons: InventoryTransactionReason[] = ['Returned', 'Maintenance Return', 'Correction', 'Other'];
const adjustmentReasons: InventoryTransactionReason[] = ['Adjustment', 'Correction', 'Other'];
const emptyMovementForm = {
  quantity: '1',
  goodQuantity: '1',
  damagedQuantity: '0',
  reason: 'Booking/Event' as InventoryTransactionReason,
  bookingReference: '',
  notes: '',
};

function getInventoryNumber(item: InventoryItem, index: number) {
  return index + 1;
}

function createInventoryId(items: InventoryItem[]) {
  const nextNumber = items.reduce((highest, item) => Math.max(highest, Number(item.id.match(/^inventory-(\d+)$/)?.[1] ?? 0)), 0) + 1;

  return `inventory-${nextNumber}`;
}

function createTransactionId(type: InventoryTransaction['type']) {
  return `${type}-${Math.random().toString(36).slice(2, 10)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function asCount(value: unknown) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function countText(value: number) {
  return String(Math.max(0, Math.floor(value)));
}

function balanceQuantityForm(current: InventoryFormState, field: 'totalQuantity' | 'availableQuantity' | 'inUseQuantity' | 'damagedQuantity', value: string): InventoryFormState {
  const totalQuantity = asCount(field === 'totalQuantity' ? value : current.totalQuantity);
  const damagedQuantity = Math.min(asCount(field === 'damagedQuantity' ? value : current.damagedQuantity), totalQuantity);

  if (field === 'availableQuantity') {
    const availableQuantity = Math.min(asCount(value), Math.max(0, totalQuantity - damagedQuantity));
    return { ...current, availableQuantity: countText(availableQuantity), damagedQuantity: countText(damagedQuantity), inUseQuantity: countText(totalQuantity - availableQuantity - damagedQuantity) };
  }

  if (field === 'inUseQuantity') {
    const inUseQuantity = Math.min(asCount(value), Math.max(0, totalQuantity - damagedQuantity));
    return { ...current, inUseQuantity: countText(inUseQuantity), damagedQuantity: countText(damagedQuantity), availableQuantity: countText(totalQuantity - inUseQuantity - damagedQuantity) };
  }

  const inUseQuantity = Math.min(asCount(current.inUseQuantity), Math.max(0, totalQuantity - damagedQuantity));
  return { ...current, totalQuantity: countText(totalQuantity), damagedQuantity: countText(damagedQuantity), inUseQuantity: countText(inUseQuantity), availableQuantity: countText(totalQuantity - inUseQuantity - damagedQuantity) };
}

function normalizeInventoryItem(item: InventoryItem): InventoryItem {
  const legacyQuantity = asCount(item.quantity);
  const itemType = item.itemType ?? (['Soap', 'Tissues', 'Cleaning Supplies'].includes(item.name) ? 'consumable' : 'reusable');
  const inUseQuantity = asCount(item.inUseQuantity);
  const damagedQuantity = itemType === 'consumable' ? 0 : asCount(item.damagedQuantity);
  const availableQuantity = asCount(item.availableQuantity ?? legacyQuantity);
  const totalQuantity = Math.max(asCount(item.totalQuantity), availableQuantity + inUseQuantity + damagedQuantity);

  return {
    ...item,
    room_id: item.room_id ?? '',
    itemType,
    totalQuantity,
    availableQuantity,
    inUseQuantity,
    damagedQuantity,
  };
}

function toStatus(item: InventoryItem): InventoryStatus {
  const normalizedItem = normalizeInventoryItem(item);

  if (normalizedItem.underMaintenance) return 'under-maintenance';
  if (normalizedItem.availableQuantity <= 0) return 'out-of-stock';
  if (normalizedItem.availableQuantity <= normalizedItem.reorderLevel) return 'low-stock';
  return 'available';
}

function statusLabel(status: InventoryStatus) {
  const labels: Record<InventoryStatus, string> = {
    available: 'Available',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Out of Stock',
    'under-maintenance': 'Under Maintenance',
  };

  return labels[status];
}

function statusClasses(status: InventoryStatus) {
  const styles: Record<InventoryStatus, string> = {
    available: 'bg-emerald-50 text-emerald-700',
    'low-stock': 'bg-amber-50 text-amber-700',
    'out-of-stock': 'bg-rose-50 text-rose-700',
    'under-maintenance': 'bg-slate-100 text-slate-700',
  };

  return styles[status];
}

function toFormState(item: InventoryItem): InventoryFormState {
  const normalizedItem = normalizeInventoryItem(item);

  return {
    room_id: normalizedItem.room_id,
    name: normalizedItem.name,
    category: normalizedItem.category,
    itemType: normalizedItem.itemType ?? 'reusable',
    totalQuantity: String(normalizedItem.totalQuantity),
    availableQuantity: String(normalizedItem.availableQuantity),
    inUseQuantity: String(normalizedItem.inUseQuantity),
    damagedQuantity: String(normalizedItem.damagedQuantity),
    unit: normalizedItem.unit,
    reorderLevel: String(normalizedItem.reorderLevel),
    location: normalizedItem.location,
    underMaintenance: Boolean(normalizedItem.underMaintenance),
    notes: normalizedItem.notes ?? '',
  };
}

function toInventoryItem(form: InventoryFormState, items: InventoryItem[], existing?: InventoryItem): InventoryItem {
  const balancedForm = balanceQuantityForm(form, 'availableQuantity', form.availableQuantity);
  const isConsumable = form.itemType === 'consumable';

  return {
    id: existing?.id ?? createInventoryId(items),
    room_id: form.room_id,
    name: form.name.trim(),
    category: form.category.trim() || 'General',
    itemType: form.itemType,
    totalQuantity: existing ? existing.totalQuantity : asCount(balancedForm.totalQuantity),
    availableQuantity: existing ? existing.availableQuantity : asCount(balancedForm.availableQuantity),
    inUseQuantity: existing ? existing.inUseQuantity : asCount(balancedForm.inUseQuantity),
    damagedQuantity: isConsumable ? 0 : existing ? existing.damagedQuantity : asCount(balancedForm.damagedQuantity),
    unit: form.unit.trim() || 'pcs',
    reorderLevel: asCount(form.reorderLevel),
    location: form.location.trim(),
    underMaintenance: form.itemType === 'reusable' && form.underMaintenance,
    archived: existing?.archived,
    archivedAt: existing?.archivedAt,
    notes: form.notes.trim(),
    updatedAt: todayKey(),
  };
}

function transactionVerb(type: InventoryTransaction['type']) {
  if (type === 'stock-in') return 'Stock In';
  if (type === 'issue' || type === 'stock-out') return 'Issue';
  if (type === 'return') return 'Return';
  if (type === 'damaged') return 'Damaged';
  return 'Adjustment';
}

export function InventoryPage() {
  const { bookings, inventoryItems, inventoryTransactions, saveInventoryItems, saveInventoryState } = useAppData();
  const normalizedItems = useMemo(() => inventoryItems.map(normalizeInventoryItem), [inventoryItems]);
  const transactions = Array.isArray(inventoryTransactions) ? inventoryTransactions : [];
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | 'stock-out' | 'stock-in' | 'return' | 'adjustment' | 'archive' | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [form, setForm] = useState<InventoryFormState>(emptyForm);
  const [movementForm, setMovementForm] = useState(emptyMovementForm);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [isSaving, setIsSaving] = useState(false);
  const [openActionItemId, setOpenActionItemId] = useState<string | null>(null);

  const selectedItem = normalizedItems.find((item) => item.id === selectedItemId) ?? null;
  const selectedItemTransactions = useMemo(
    () => transactions
      .filter((transaction) => transaction.itemId === selectedItemId)
      .slice()
      .sort((firstTransaction, secondTransaction) => secondTransaction.createdAt.localeCompare(firstTransaction.createdAt))
      .slice(0, 6),
    [selectedItemId, transactions],
  );
  const activeItems = useMemo(
    () => normalizedItems
      .filter((item) => !item.archived)
      .slice()
      .sort((firstItem, secondItem) => (
        firstItem.category.localeCompare(secondItem.category)
        || firstItem.name.localeCompare(secondItem.name)
      )),
    [normalizedItems],
  );
  const categories = useMemo(() => ['All', ...Array.from(new Set(activeItems.map((item) => item.category))).sort()], [activeItems]);
  const statuses = ['All', 'Available', 'Low Stock', 'Out of Stock', 'Under Maintenance', 'Archived'];
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return normalizedItems.filter((item) => {
      const itemStatus = statusLabel(toStatus(item));
      const matchesArchived = statusFilter === 'Archived' ? item.archived : !item.archived;
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesStatus = statusFilter === 'All' || statusFilter === 'Archived' || itemStatus === statusFilter;
      const matchesQuery = !normalizedQuery || [item.id, item.name, item.category, item.location, item.notes ?? ''].some((value) => value.toLowerCase().includes(normalizedQuery));

      return matchesArchived && matchesCategory && matchesStatus && matchesQuery;
    }).sort((firstItem, secondItem) => (
      firstItem.category.localeCompare(secondItem.category)
      || firstItem.name.localeCompare(secondItem.name)
    ));
  }, [categoryFilter, normalizedItems, query, statusFilter]);

  const openCreateModal = () => {
    setSelectedItemId(null);
    setForm({ ...emptyForm, room_id: '' });
    setModalMode('create');
  };

  const openItemModal = (item: InventoryItem, mode: 'edit' | 'view') => {
    setSelectedItemId(item.id);
    setForm(toFormState(item));
    setModalMode(mode);
  };

  const openMovementModal = (item: InventoryItem, mode: 'stock-out' | 'stock-in' | 'return' | 'adjustment' | 'archive') => {
    setSelectedItemId(item.id);
    setForm(toFormState(item));
    setMovementForm({
      quantity: '1',
      goodQuantity: mode === 'return' ? '1' : '0',
      damagedQuantity: '0',
      reason: mode === 'stock-in' ? 'Restock' : mode === 'return' ? 'Returned' : mode === 'adjustment' ? 'Adjustment' : mode === 'archive' ? 'Archived' : 'Booking/Event',
      bookingReference: '',
      notes: '',
    });
    setModalMode(mode);
  };

  const closeModal = () => {
    setModalMode(null);
    setSelectedItemId(null);
  };

  const saveItems = async (nextItems: InventoryItem[]) => {
    await saveInventoryItems(nextItems.map(normalizeInventoryItem));
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;

    setIsSaving(true);
    const existingItem = normalizedItems.find((item) => item.id === selectedItemId);
    const nextItem = toInventoryItem(form, normalizedItems, existingItem);
    const nextItems = existingItem ? normalizedItems.map((item) => (item.id === existingItem.id ? nextItem : item)) : [nextItem, ...normalizedItems];

    try {
      if (existingItem) {
        await saveItems(nextItems);
      } else {
        const openingTransaction: InventoryTransaction | null = nextItem.availableQuantity > 0
          ? {
              id: createTransactionId('stock-in'),
              itemId: nextItem.id,
              itemName: nextItem.name,
              type: 'stock-in',
              quantity: nextItem.availableQuantity,
              previousQuantity: 0,
              newQuantity: nextItem.availableQuantity,
              performedBy: 'Watikolo Inventory Staff',
              reason: 'Restock',
              notes: 'Opening inventory balance.',
              createdAt: new Date().toISOString(),
            }
          : null;

        await saveInventoryState(nextItems, openingTransaction ? [openingTransaction, ...transactions] : transactions);
      }
      closeModal();
    } finally {
      setIsSaving(false);
    }
  };

  const createMovementTransaction = (
    item: InventoryItem,
    type: InventoryTransaction['type'],
    quantity: number,
    previousQuantity: number,
    newQuantity: number,
  ): InventoryTransaction => ({
    id: createTransactionId(type),
    itemId: item.id,
    itemName: item.name,
    type,
    quantity,
    previousQuantity,
    newQuantity,
    bookingReference: movementForm.bookingReference.trim(),
    performedBy: 'Watikolo Inventory Staff',
    reason: movementForm.reason,
    notes: movementForm.notes.trim(),
    createdAt: new Date().toISOString(),
  });

  const handleMovement = async () => {
    if (!selectedItem || !modalMode || !['stock-out', 'stock-in', 'return', 'adjustment'].includes(modalMode)) return;

    const quantity = asCount(movementForm.quantity);
    const goodQuantity = selectedItem.itemType === 'reusable' ? asCount(movementForm.goodQuantity) : 0;
    const damagedQuantity = selectedItem.itemType === 'reusable' ? asCount(movementForm.damagedQuantity) : 0;
    const returnQuantity = goodQuantity + damagedQuantity;
    const previousAvailableQuantity = selectedItem.availableQuantity;
    const previousDamagedQuantity = selectedItem.damagedQuantity;
    const nextItem: InventoryItem = { ...selectedItem, updatedAt: todayKey() };
    const nextTransactions: InventoryTransaction[] = [];

    if (modalMode === 'stock-in') {
      if (quantity <= 0) return;
      nextItem.availableQuantity += quantity;
      nextItem.totalQuantity += quantity;
      nextTransactions.push(createMovementTransaction(selectedItem, 'stock-in', quantity, previousAvailableQuantity, nextItem.availableQuantity));
    } else if (modalMode === 'return') {
      if (selectedItem.itemType === 'consumable' || returnQuantity <= 0 || returnQuantity > selectedItem.inUseQuantity) return;
      nextItem.inUseQuantity -= returnQuantity;
      nextItem.availableQuantity += goodQuantity;
      nextItem.damagedQuantity += damagedQuantity;

      if (goodQuantity > 0) {
        nextTransactions.push(createMovementTransaction(selectedItem, 'return', goodQuantity, previousAvailableQuantity, nextItem.availableQuantity));
      }

      if (damagedQuantity > 0) {
        nextTransactions.push(createMovementTransaction(selectedItem, 'damaged', damagedQuantity, previousDamagedQuantity, nextItem.damagedQuantity));
      }
    } else if (modalMode === 'adjustment') {
      if (quantity < 0) return;
      nextItem.availableQuantity = quantity;
      nextItem.totalQuantity = selectedItem.itemType === 'consumable'
        ? quantity + selectedItem.inUseQuantity
        : quantity + selectedItem.inUseQuantity + selectedItem.damagedQuantity;
      nextTransactions.push(createMovementTransaction(selectedItem, 'adjustment', Math.abs(quantity - previousAvailableQuantity), previousAvailableQuantity, nextItem.availableQuantity));
    } else {
      if (quantity <= 0 || quantity > selectedItem.availableQuantity) return;
      nextItem.availableQuantity -= quantity;

      if (selectedItem.itemType === 'consumable') {
        nextItem.totalQuantity = Math.max(0, nextItem.totalQuantity - quantity);
      } else if (movementForm.reason === 'Damaged') {
        nextItem.damagedQuantity += quantity;
        nextTransactions.push(createMovementTransaction(selectedItem, 'damaged', quantity, previousDamagedQuantity, nextItem.damagedQuantity));
      } else {
        nextItem.inUseQuantity += quantity;
      }

      nextTransactions.push(createMovementTransaction(selectedItem, 'issue', quantity, previousAvailableQuantity, nextItem.availableQuantity));
    }

    setIsSaving(true);
    try {
      await saveInventoryState(normalizedItems.map((item) => (item.id === selectedItem.id ? nextItem : item)), [...nextTransactions, ...transactions]);
      closeModal();
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!selectedItem) return;

    const hasTransactions = transactions.some((transaction) => transaction.itemId === selectedItem.id);
    const message = hasTransactions
      ? `Archive ${selectedItem.name}? Historical transactions will be kept for reports.`
      : `${selectedItem.name} has no transaction history. Permanently delete it instead?`;

    if (!window.confirm(message)) return;

    if (!hasTransactions) {
      await saveItems(normalizedItems.filter((current) => current.id !== selectedItem.id));
      closeModal();
      return;
    }

    const archivedItem: InventoryItem = { ...selectedItem, archived: true, archivedAt: new Date().toISOString(), updatedAt: todayKey() };
    const transaction = createMovementTransaction(selectedItem, 'adjustment', 0, selectedItem.availableQuantity, selectedItem.availableQuantity);

    setIsSaving(true);
    try {
      await saveInventoryState(normalizedItems.map((item) => (item.id === selectedItem.id ? archivedItem : item)), [transaction, ...transactions]);
      closeModal();
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = modalMode === 'view';
  const isExistingItemForm = modalMode === 'edit';
  const formTitle = modalMode === 'create' ? 'Add Inventory Item' : modalMode === 'stock-in' ? 'Stock In' : modalMode === 'stock-out' ? 'Issue Item' : modalMode === 'return' ? 'Return Item' : modalMode === 'adjustment' ? 'Adjustment' : modalMode === 'archive' ? 'Archive Item' : modalMode === 'view' ? 'View Inventory Item' : 'Edit Inventory Item';
  const movementQuantity = asCount(movementForm.quantity);
  const returnGoodQuantity = asCount(movementForm.goodQuantity);
  const returnDamagedQuantity = asCount(movementForm.damagedQuantity);
  const totalReturnQuantity = returnGoodQuantity + returnDamagedQuantity;
  const movementReasons = modalMode === 'stock-in' ? stockInReasons : modalMode === 'return' ? returnReasons : modalMode === 'adjustment' ? adjustmentReasons : stockOutReasons;
  const movementError = selectedItem && modalMode === 'stock-out' && movementQuantity > selectedItem.availableQuantity
    ? `Only ${selectedItem.availableQuantity} ${selectedItem.unit} available.`
    : selectedItem && modalMode === 'return' && totalReturnQuantity > selectedItem.inUseQuantity
      ? `Only ${selectedItem.inUseQuantity} ${selectedItem.unit} in use.`
      : selectedItem && modalMode === 'return' && totalReturnQuantity <= 0
        ? 'Enter at least 1 returned item.'
      : '';
  const availableItems = activeItems.filter((item) => toStatus(item) === 'available').length;
  const lowStockItems = activeItems.filter((item) => toStatus(item) === 'low-stock').length;
  const outOfStockItems = activeItems.filter((item) => toStatus(item) === 'out-of-stock').length;

  return (
    <div className="inventory-page space-y-2.5">
      <div className="rounded-[14px] border border-white/80 bg-white px-3 py-3 shadow-card sm:px-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Operations</p>
            <h1 className="mt-0.5 text-lg font-bold text-ink sm:text-xl">Inventory Management</h1>
            <p className="mt-0.5 text-xs leading-5 text-slate-500">Track supplies, equipment, reusable items, and stock movement.</p>
          </div>
          <Button onClick={openCreateModal} className="h-9 w-full gap-2 px-3 py-2 text-xs sm:w-auto"><Plus className="h-4 w-4" />Add Inventory Item</Button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Inventory summary">
        {[
          ['Total items', activeItems.length, 'border-slate-200 bg-white text-ink'],
          ['Available', availableItems, 'border-emerald-100 bg-emerald-50 text-emerald-700'],
          ['Needs attention', lowStockItems + outOfStockItems, 'border-amber-100 bg-amber-50 text-amber-700'],
          ['Transactions', transactions.length, 'border-brand-100 bg-brand-50 text-[#294c5f]'],
        ].map(([label, value, classes]) => (
          <div key={label} className={cn('rounded-xl border px-3 py-2.5 shadow-sm', classes as string)}>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] opacity-70">{label}</p>
            <p className="mt-1 text-xl font-bold">{value}</p>
          </div>
        ))}
      </section>

      <div className="rounded-[14px] border border-white/80 bg-white px-3 py-3 shadow-card sm:px-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search item..." className="interactive-ring h-9 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-xs text-ink placeholder:text-slate-400 md:w-[210px]" />
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="interactive-ring h-9 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-xs text-ink md:w-[210px]">
            {categories.map((category) => <option key={category} value={category}>{category === 'All' ? 'All Categories' : category}</option>)}
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="interactive-ring h-9 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-xs text-ink md:w-[210px]">
            {statuses.map((status) => <option key={status} value={status}>{status === 'All' ? 'All Status' : status}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-card">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[900px] divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                {['No.', 'Item', 'Category', 'Stock', 'Used / Damaged', 'Status', 'Actions'].map((heading) => (
                  <th key={heading} className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map((item, index) => {
                const status = toStatus(item);
                const itemNumber = getInventoryNumber(item, index);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-2 py-1.5 align-middle font-semibold text-slate-500">{itemNumber}</td>
                    <td className="px-2 py-1.5 align-middle">
                      <div className="flex items-center gap-1.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-[#294c5f]"><Boxes className="h-3.5 w-3.5" /></span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-ink">{item.name}</p>
                          <p className="text-[11px] capitalize text-slate-400">{item.itemType}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 align-middle text-slate-600">{item.category}</td>
                    <td className="px-2 py-1.5 align-middle">
                      <p className="font-semibold text-emerald-700">{item.availableQuantity} {item.unit}</p>
                      <p className="text-[11px] text-slate-400">of {item.totalQuantity} total</p>
                    </td>
                    <td className="px-2 py-1.5 align-middle">
                      <p className="text-slate-600">{item.itemType === 'consumable' ? `${item.inUseQuantity} used` : `${item.inUseQuantity} ${item.unit} in use`}</p>
                      <p className="text-[11px] text-slate-400">{item.itemType === 'consumable' ? 'Damage not tracked' : `${item.damagedQuantity} ${item.unit} damaged`}</p>
                    </td>
                    <td className="px-2 py-1.5 align-middle"><span className={cn('inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold', statusClasses(status))}>{statusLabel(status)}</span></td>
                    <td className="px-2 py-1.5 align-middle">
                      <div className="flex items-center gap-1">
                        <button type="button" aria-label={`Stock in ${item.name}`} title="Stock In" onClick={() => openMovementModal(item, 'stock-in')} className="interactive-ring rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100">Stock In</button>
                        <button type="button" aria-label={`Issue ${item.name}`} title="Issue" onClick={() => openMovementModal(item, 'stock-out')} disabled={item.availableQuantity <= 0} className="interactive-ring rounded-md bg-[#edf4ff] px-2 py-1 text-[10px] font-bold text-[#294c5f] hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-50">Issue</button>
                        <div className="relative">
                          <button type="button" aria-label={`More actions for ${item.name}`} title="More actions" onClick={() => setOpenActionItemId((current) => current === item.id ? null : item.id)} className="interactive-ring rounded-md bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200"><MoreHorizontal className="h-3.5 w-3.5" /></button>
                          {openActionItemId === item.id ? (
                            <div className="absolute right-0 top-8 z-20 flex min-w-28 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                              <button type="button" onClick={() => { setOpenActionItemId(null); openItemModal(item, 'view'); }} className="rounded-lg px-2.5 py-1.5 text-left text-[10px] font-bold text-[#294c5f] hover:bg-brand-50">View</button>
                              <button type="button" onClick={() => { setOpenActionItemId(null); openItemModal(item, 'edit'); }} className="rounded-lg px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-600 hover:bg-slate-100">Edit</button>
                              {item.itemType === 'reusable' ? <button type="button" onClick={() => { setOpenActionItemId(null); openMovementModal(item, 'return'); }} disabled={item.inUseQuantity <= 0} className="rounded-lg px-2.5 py-1.5 text-left text-[10px] font-bold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50">Return</button> : null}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filteredItems.length === 0 ? <div className="px-5 py-10 text-center text-sm font-semibold text-slate-500">No inventory items found.</div> : null}
      </div>

      <Modal open={modalMode !== null} onClose={closeModal} title={formTitle}>
        {modalMode === 'view' && selectedItem ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{selectedItem.id}</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{selectedItem.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedItem.category} - {selectedItem.location || 'Watikolo Resort inventory'}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                [selectedItem.itemType === 'consumable' ? 'Total Stock' : 'Total', selectedItem.totalQuantity],
                [selectedItem.itemType === 'consumable' ? 'Available Stock' : 'Available', selectedItem.availableQuantity],
                [selectedItem.itemType === 'consumable' ? 'Released / Used' : 'In Use', selectedItem.inUseQuantity],
                [selectedItem.itemType === 'consumable' ? 'Damaged' : 'Damaged', selectedItem.itemType === 'consumable' ? 'N/A' : selectedItem.damagedQuantity],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500">{label}</p>
                  <p className="mt-1 text-lg font-bold text-ink">{value === 'N/A' ? value : `${value} ${selectedItem.unit}`}</p>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">Minimum Stock Level</p>
                <p className="mt-1 text-sm font-bold text-ink">{selectedItem.reorderLevel} {selectedItem.unit}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">Current Status</p>
                <p className="mt-1 text-sm font-bold text-ink">{statusLabel(toStatus(selectedItem))}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-500">Last Updated</p>
                <p className="mt-1 text-sm font-bold text-ink">{selectedItem.updatedAt}</p>
              </div>
            </div>
            <p className="text-sm leading-6 text-slate-600">{selectedItem.notes || 'No notes saved for this item.'}</p>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-ink">Recent transactions</p>
              <div className="mt-3 space-y-2">
                {selectedItemTransactions.map((transaction) => (
                  <div key={transaction.id} className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    <p className="font-bold text-ink">{transactionVerb(transaction.type)} - {transaction.quantity} {selectedItem.unit}</p>
                    <p className="mt-0.5">{new Date(transaction.createdAt).toLocaleString()} {transaction.bookingReference ? `- ${transaction.bookingReference}` : ''}</p>
                    {transaction.notes ? <p className="mt-0.5">{transaction.notes}</p> : null}
                  </div>
                ))}
                {selectedItemTransactions.length === 0 ? <p className="text-xs text-slate-500">No transactions recorded yet.</p> : null}
              </div>
            </div>
          </div>
        ) : selectedItem && modalMode === 'archive' ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-rose-50 p-4 text-sm text-rose-700">
              Archive {selectedItem.name}? Items with transaction history will be hidden from active inventory but kept for reports.
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Archive notes</span>
              <textarea value={movementForm.notes} onChange={(event) => setMovementForm((current) => ({ ...current, notes: event.target.value }))} className="interactive-ring min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400" placeholder="Optional reason for archiving" />
            </label>
          </div>
        ) : selectedItem && (modalMode === 'stock-out' || modalMode === 'stock-in' || modalMode === 'return' || modalMode === 'adjustment') ? (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">{selectedItem.id}</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{selectedItem.name}</h2>
              <p className="mt-1 text-sm text-slate-500">Available: {selectedItem.availableQuantity} {selectedItem.unit} - In use: {selectedItem.inUseQuantity} {selectedItem.unit}</p>
            </div>
            {modalMode === 'return' ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <InputField label="Good condition returned" type="number" min="0" value={movementForm.goodQuantity} hint={movementError || undefined} onChange={(event) => setMovementForm((current) => ({ ...current, goodQuantity: event.target.value }))} />
                <InputField label="Returned damaged" type="number" min="0" value={movementForm.damagedQuantity} onChange={(event) => setMovementForm((current) => ({ ...current, damagedQuantity: event.target.value }))} />
              </div>
            ) : (
              <InputField label={modalMode === 'adjustment' ? 'New Available Quantity' : 'Quantity'} type="number" min={modalMode === 'adjustment' ? '0' : '1'} value={movementForm.quantity} hint={movementError || undefined} onChange={(event) => setMovementForm((current) => ({ ...current, quantity: event.target.value }))} />
            )}
            <SelectField label="Reason" value={movementForm.reason} options={movementReasons.map((reason) => ({ label: reason, value: reason }))} onChange={(event) => setMovementForm((current) => ({ ...current, reason: event.target.value as InventoryTransactionReason }))} />
            {modalMode === 'stock-out' ? (
              <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
                <span>Booking reference (optional)</span>
                <input list="inventory-booking-references" value={movementForm.bookingReference} onChange={(event) => setMovementForm((current) => ({ ...current, bookingReference: event.target.value }))} className="interactive-ring h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm text-ink placeholder:text-slate-400" placeholder="WTK-2026-0027" />
                <datalist id="inventory-booking-references">
                  {bookings.map((booking) => <option key={booking.id} value={booking.reference}>{booking.customerName}</option>)}
                </datalist>
              </label>
            ) : null}
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              <span>Notes</span>
              <textarea value={movementForm.notes} onChange={(event) => setMovementForm((current) => ({ ...current, notes: event.target.value }))} className="interactive-ring min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400" placeholder="Optional details" />
            </label>
            <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4 text-sm text-[#294c5f]">
              Confirming will record this {transactionVerb(modalMode).toLowerCase()} transaction and update the inventory quantity.
              {modalMode === 'stock-out' && selectedItem.itemType === 'consumable' ? ' Consumable stock will be recorded as released/used.' : ''}
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <InputField label="Item name" value={form.name} disabled={isReadOnly} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <InputField label="Category" value={form.category} disabled={isReadOnly} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} />
            <SelectField label="Item Type" value={form.itemType} disabled={isReadOnly} options={[{ label: 'Consumable', value: 'consumable' }, { label: 'Reusable', value: 'reusable' }]} onChange={(event) => setForm((current) => ({ ...current, itemType: event.target.value as InventoryItemType }))} />
            <InputField label="Unit" value={form.unit} disabled={isReadOnly} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} />
            <InputField label="Location" value={form.location} disabled={isReadOnly} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
            {!isExistingItemForm ? (
              <>
                <InputField label={form.itemType === 'consumable' ? 'Total Stock' : 'Total Quantity'} type="number" min="0" value={form.totalQuantity} disabled={isReadOnly} onChange={(event) => setForm((current) => balanceQuantityForm(current, 'totalQuantity', event.target.value))} />
                <InputField label={form.itemType === 'consumable' ? 'Available Stock' : 'Available'} type="number" min="0" value={form.availableQuantity} disabled={isReadOnly} onChange={(event) => setForm((current) => balanceQuantityForm(current, 'availableQuantity', event.target.value))} />
                {form.itemType === 'reusable' ? (
                  <>
                    <InputField label="In Use" type="number" min="0" value={form.inUseQuantity} disabled={isReadOnly} onChange={(event) => setForm((current) => balanceQuantityForm(current, 'inUseQuantity', event.target.value))} />
                    <InputField label="Damaged" type="number" min="0" value={form.damagedQuantity} disabled={isReadOnly} onChange={(event) => setForm((current) => balanceQuantityForm(current, 'damagedQuantity', event.target.value))} />
                  </>
                ) : null}
              </>
            ) : (
              <div className="rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs font-semibold leading-5 text-amber-800 md:col-span-2">
                Use Stock In, Issue, or Return to change quantities so every movement is recorded in transaction history.
              </div>
            )}
            <InputField label="Minimum Stock Level" type="number" min="0" value={form.reorderLevel} disabled={isReadOnly} onChange={(event) => setForm((current) => ({ ...current, reorderLevel: event.target.value }))} />
            {form.itemType === 'reusable' ? (
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.underMaintenance} disabled={isReadOnly} onChange={(event) => setForm((current) => ({ ...current, underMaintenance: event.target.checked }))} className="h-4 w-4 rounded border-slate-300 text-[#294c5f] focus:ring-brand-300" />
                Under Maintenance
              </label>
            ) : null}
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700 md:col-span-2">
              <span>Notes</span>
              <textarea value={form.notes} disabled={isReadOnly} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="interactive-ring min-h-24 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 disabled:bg-slate-50" />
            </label>
          </div>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={closeModal}>{modalMode === 'view' ? 'Close' : 'Cancel'}</Button>
          {modalMode === 'create' || modalMode === 'edit' ? <Button type="button" onClick={() => void handleSave()} disabled={isSaving || !form.name.trim()}>{isSaving ? 'Saving...' : 'Save Item'}</Button> : null}
          {modalMode === 'stock-in' || modalMode === 'stock-out' || modalMode === 'return' || modalMode === 'adjustment' ? (
            <Button type="button" onClick={() => void handleMovement()} disabled={isSaving || (modalMode === 'return' ? totalReturnQuantity <= 0 : modalMode !== 'adjustment' && movementQuantity <= 0) || Boolean(movementError)}>
              {isSaving ? 'Saving...' : `Confirm ${transactionVerb(modalMode)}`}
            </Button>
          ) : null}
          {modalMode === 'archive' ? <Button type="button" variant="danger" onClick={() => void handleArchive()} disabled={isSaving}>{isSaving ? 'Saving...' : 'Archive Item'}</Button> : null}
        </div>
      </Modal>
    </div>
  );
}
