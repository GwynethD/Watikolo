import { useMemo, useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import type { InventoryItem, InventoryStatus, InventoryTransaction } from '@/types';
import { cn } from '@/utils/cn';

const logoImage = new URL('../../pictures/watikolo-logo.png', import.meta.url).href;

type ReportRange = 'day' | 'week' | 'month';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function asCount(value: unknown) {
  return Math.max(0, Math.floor(Number(value) || 0));
}

function normalizeInventoryItem(item: InventoryItem): InventoryItem {
  const legacyQuantity = asCount(item.quantity);
  const inUseQuantity = asCount(item.inUseQuantity);
  const damagedQuantity = asCount(item.damagedQuantity);
  const availableQuantity = asCount(item.availableQuantity ?? legacyQuantity);
  const totalQuantity = Math.max(asCount(item.totalQuantity), availableQuantity + inUseQuantity + damagedQuantity);

  return {
    ...item,
    room_id: item.room_id ?? '',
    itemType: item.itemType ?? (['Soap', 'Tissues', 'Cleaning Supplies'].includes(item.name) ? 'consumable' : 'reusable'),
    totalQuantity,
    availableQuantity,
    inUseQuantity,
    damagedQuantity,
  };
}

function getInventoryNumber(item: InventoryItem, index: number) {
  return index + 1;
}

function toStatus(item: InventoryItem): InventoryStatus {
  if (item.underMaintenance) return 'under-maintenance';
  if (item.availableQuantity <= 0) return 'out-of-stock';
  if (item.availableQuantity <= item.reorderLevel) return 'low-stock';
  return 'available';
}

function statusLabel(status: InventoryStatus) {
  const labels: Record<InventoryStatus, string> = {
    available: 'In Stock',
    'low-stock': 'Low Stock',
    'out-of-stock': 'Critical',
    'under-maintenance': 'Maintenance',
  };

  return labels[status];
}

function statusClasses(status: InventoryStatus) {
  const styles: Record<InventoryStatus, string> = {
    available: 'bg-emerald-50 text-emerald-700',
    'low-stock': 'bg-amber-50 text-amber-700',
    'out-of-stock': 'bg-rose-50 text-rose-700',
    'under-maintenance': 'bg-slate-200 text-slate-700',
  };

  return styles[status];
}

function reportStatus(item: InventoryItem, status: InventoryStatus) {
  if (item.itemType !== 'consumable' && item.inUseQuantity > 0) return 'In Use';
  if (status === 'available') return 'Available';
  if (status === 'low-stock') return 'Low Stock';
  if (status === 'out-of-stock') return 'Out of Stock';
  return 'Maintenance';
}

function reportStatusClasses(label: string) {
  if (label === 'In Use') return 'bg-blue-50 text-blue-700';
  if (label === 'Low Stock') return 'bg-amber-50 text-amber-700';
  if (label === 'Out of Stock') return 'bg-rose-50 text-rose-700';
  if (label === 'Maintenance') return 'bg-slate-200 text-slate-700';
  return 'bg-emerald-50 text-emerald-700';
}

function transactionVerb(type: InventoryTransaction['type']) {
  if (type === 'stock-in') return 'Stock In';
  if (type === 'issue' || type === 'stock-out') return 'Issue';
  if (type === 'return') return 'Return';
  if (type === 'damaged') return 'Damaged';
  return 'Adjustment';
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatLongDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(`${value}T00:00:00`) : value);
}

function formatShortDate(value: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(typeof value === 'string' ? new Date(`${value}T00:00:00`) : value);
}

function getPresetDateRange(reportRange: ReportRange, dateKey: string) {
  const selectedDate = startOfDay(new Date(`${dateKey}T00:00:00`));

  if (Number.isNaN(selectedDate.getTime())) {
    return { from: todayKey(), to: todayKey() };
  }

  if (reportRange === 'day') {
    return { from: toInputDate(selectedDate), to: toInputDate(selectedDate) };
  }

  if (reportRange === 'week') {
    const weekStart = new Date(selectedDate);
    weekStart.setDate(selectedDate.getDate() - selectedDate.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return { from: toInputDate(weekStart), to: toInputDate(weekEnd) };
  }

  const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
  const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

  return { from: toInputDate(monthStart), to: toInputDate(monthEnd) };
}

function orderedDateKeys(fromDate: string, toDate: string) {
  return [fromDate, toDate].sort();
}

function isTransactionInDateRange(transaction: InventoryTransaction, reportFromDate: string, reportToDate: string) {
  const [fromKey, toKey] = orderedDateKeys(reportFromDate, reportToDate);
  const fromDate = startOfDay(new Date(`${fromKey}T00:00:00`));
  const toDate = startOfDay(new Date(`${toKey}T00:00:00`));
  const transactionDate = startOfDay(new Date(transaction.createdAt));

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime()) || Number.isNaN(transactionDate.getTime())) {
    return false;
  }

  return transactionDate >= fromDate && transactionDate <= toDate;
}

function isTransactionAfterDate(transaction: InventoryTransaction, reportToDate: string) {
  const toDate = startOfDay(new Date(`${reportToDate}T00:00:00`));
  const transactionDate = startOfDay(new Date(transaction.createdAt));

  if (Number.isNaN(toDate.getTime()) || Number.isNaN(transactionDate.getTime())) {
    return false;
  }

  return transactionDate > toDate;
}

function availableQuantityDelta(transaction: InventoryTransaction) {
  if (transaction.type === 'stock-in' || transaction.type === 'return') {
    return transaction.quantity;
  }

  if (transaction.type === 'stock-out' || transaction.type === 'issue') {
    return -transaction.quantity;
  }

  if (transaction.type === 'adjustment' && typeof transaction.previousQuantity === 'number' && typeof transaction.newQuantity === 'number') {
    return transaction.newQuantity - transaction.previousQuantity;
  }

  return 0;
}

function csvValue(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function itemMatchesFilters(item: InventoryItem, typeFilter: string, itemFilter: string) {
  const itemType = item.itemType === 'consumable' ? 'Consumable' : 'Reusable';
  return (typeFilter === 'All' || itemType === typeFilter) && (itemFilter === 'All' || item.id === itemFilter);
}

function transactionMatchesItems(transaction: InventoryTransaction, items: InventoryItem[]) {
  return items.some((item) => item.id === transaction.itemId || item.name === transaction.itemName);
}

export function InventoryReportsPage() {
  const { inventoryItems, inventoryTransactions } = useAppData();
  const normalizedItems = useMemo(() => inventoryItems.map(normalizeInventoryItem), [inventoryItems]);
  const transactions = Array.isArray(inventoryTransactions) ? inventoryTransactions : [];
  const [reportPreset, setReportPreset] = useState<ReportRange>('month');
  const [reportFromDate, setReportFromDate] = useState(() => getPresetDateRange('month', todayKey()).from);
  const [reportToDate, setReportToDate] = useState(() => getPresetDateRange('month', todayKey()).to);
  const [typeFilter, setTypeFilter] = useState('All');
  const [itemFilter, setItemFilter] = useState('All');

  const activeReportItems = useMemo(
    () => normalizedItems
      .filter((item) => !item.archived)
      .slice()
      .sort((firstItem, secondItem) => (
        firstItem.category.localeCompare(secondItem.category)
        || firstItem.name.localeCompare(secondItem.name)
      )),
    [normalizedItems],
  );
  const types = ['All', 'Consumable', 'Reusable'];
  const filteredItems = useMemo(
    () => activeReportItems.filter((item) => itemMatchesFilters(item, typeFilter, itemFilter)),
    [activeReportItems, typeFilter, itemFilter],
  );
  const [orderedReportFromDate, orderedReportToDate] = orderedDateKeys(reportFromDate, reportToDate);
  const reportTransactions = useMemo(
    () => transactions
      .filter((transaction) => isTransactionInDateRange(transaction, orderedReportFromDate, orderedReportToDate))
      .filter((transaction) => transactionMatchesItems(transaction, filteredItems)),
    [filteredItems, orderedReportFromDate, orderedReportToDate, transactions],
  );
  const reportNumber = `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  const coverageLabel = `${formatLongDate(orderedReportFromDate)} - ${formatLongDate(orderedReportToDate)}`;
  const displayCoverageLabel = `${formatShortDate(orderedReportFromDate)} - ${formatShortDate(orderedReportToDate)}`;
  const reportRows = filteredItems.map((item, index) => {
    const itemAllTransactions = transactions.filter((transaction) => transaction.itemId === item.id || transaction.itemName === item.name);
    const itemTransactions = reportTransactions.filter((transaction) => transaction.itemId === item.id || transaction.itemName === item.name);
    const stockIn = itemTransactions.filter((transaction) => transaction.type === 'stock-in').reduce((sum, transaction) => sum + transaction.quantity, 0);
    const stockUsed = itemTransactions.filter((transaction) => transaction.type === 'stock-out' || transaction.type === 'issue').reduce((sum, transaction) => sum + transaction.quantity, 0);
    const damaged = itemTransactions.filter((transaction) => transaction.type === 'damaged').reduce((sum, transaction) => sum + transaction.quantity, 0);
    const returned = itemTransactions.filter((transaction) => transaction.type === 'return').reduce((sum, transaction) => sum + transaction.quantity, 0);
    const futureAvailableChange = itemAllTransactions
      .filter((transaction) => isTransactionAfterDate(transaction, orderedReportToDate))
      .reduce((sum, transaction) => sum + availableQuantityDelta(transaction), 0);
    const endingStock = Math.max(0, item.availableQuantity - futureAvailableChange);
    const periodAvailableChange = itemTransactions.reduce((sum, transaction) => sum + availableQuantityDelta(transaction), 0);
    const beginningStock = Math.max(0, endingStock - periodAvailableChange);
    const reportEndItem = { ...item, availableQuantity: endingStock };
    const usedQuantity = item.itemType === 'consumable'
      ? itemAllTransactions
        .filter((transaction) => transaction.type === 'stock-out' || transaction.type === 'issue')
        .reduce((sum, transaction) => sum + transaction.quantity, 0)
      : item.inUseQuantity;
    const displayStatus = reportStatus(item, toStatus(reportEndItem));

    return {
      item,
      itemNumber: getInventoryNumber(item, index),
      beginningStock,
      stockIn,
      stockUsed,
      damaged,
      returned,
      remainingStock: endingStock,
      status: toStatus(reportEndItem),
      stockQuantity: item.itemType === 'consumable' ? endingStock + usedQuantity : item.totalQuantity,
      usedQuantity,
      displayStatus,
    };
  });
  const summary = reportRows.reduce(
    (totals, row) => ({
      totalItems: totals.totalItems + 1,
      inStock: totals.inStock + (row.status === 'available' ? 1 : 0),
      lowStock: totals.lowStock + (row.status === 'low-stock' ? 1 : 0),
      critical: totals.critical + (row.status === 'out-of-stock' ? 1 : 0),
      stockIn: totals.stockIn + row.stockIn,
      stockUsed: totals.stockUsed + row.stockUsed,
      returned: totals.returned + row.returned,
    }),
    { totalItems: 0, inStock: 0, lowStock: 0, critical: 0, stockIn: 0, stockUsed: 0, returned: 0 },
  );
  const sortedReportTransactions = useMemo(() => [...reportTransactions].sort((first, second) => second.createdAt.localeCompare(first.createdAt)), [reportTransactions]);

  const handleExportReport = () => {
    const rows = [
      ['Inventory Report'],
      ['Report No.', reportNumber],
      ['Date Generated', formatLongDate(new Date())],
      ['Coverage', coverageLabel],
      ['Type', typeFilter],
      ['Item', itemFilter === 'All' ? 'All items' : activeReportItems.find((item) => item.id === itemFilter)?.name],
      [],
      ['Item', 'Type', 'Stock', 'Used', 'Available', 'Status'],
      ...reportRows.map((row) => [
        row.item.name,
        row.item.itemType === 'consumable' ? 'Consumable' : 'Reusable',
        row.stockQuantity,
        row.usedQuantity,
        row.remainingStock,
        row.displayStatus,
      ]),
      [],
      ['Summary'],
      ['Total Items', summary.totalItems],
      ['Items in Stock', summary.inStock],
      ['Low Stock Items', summary.lowStock],
      ['Critical Items', summary.critical],
      ['Stock In', summary.stockIn],
      ['Stock Used', summary.stockUsed],
      ['Returned', summary.returned],
      [],
      ['Transactions'],
      ['Date', 'Transaction ID', 'Type', 'Item', 'Quantity', 'Previous Quantity', 'New Quantity', 'Booking Reference', 'Admin/User', 'Reason', 'Notes'],
      ...sortedReportTransactions.map((transaction) => [
        new Date(transaction.createdAt).toLocaleString(),
        transaction.id,
        transactionVerb(transaction.type),
        transaction.itemName,
        transaction.quantity,
        transaction.previousQuantity ?? '',
        transaction.newQuantity ?? '',
        transaction.bookingReference ?? '',
        transaction.performedBy ?? '',
        transaction.reason,
        transaction.notes ?? '',
      ]),
    ];
    const csv = rows.map((row) => row.map(csvValue).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory-report-${orderedReportFromDate}-to-${orderedReportToDate}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const applyReportPreset = (nextPreset: ReportRange) => {
    const range = getPresetDateRange(nextPreset, todayKey());
    setReportPreset(nextPreset);
    setReportFromDate(range.from);
    setReportToDate(range.to);
  };

  return (
    <div className="inventory-page space-y-3">
      <div className="admin-screen-only rounded-[18px] border border-white/80 bg-white px-4 py-4 shadow-card sm:px-5">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-slate-400">Reports</p>
          <h1 className="mt-1 text-xl font-bold text-ink sm:text-2xl">Inventory Reports</h1>
          <p className="mt-1 text-sm leading-5 text-slate-500">Review stock levels, usage, restocks, and low inventory items in a printable report.</p>
        </div>
      </div>

      <div className="admin-screen-only rounded-[18px] border border-white/80 bg-white px-4 py-3 shadow-card">
        <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
          <div className="inline-flex w-full overflow-hidden rounded-xl border border-slate-200 bg-white sm:w-auto">
            {(['day', 'week', 'month'] as ReportRange[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyReportPreset(preset)}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-bold capitalize transition sm:flex-none',
                  reportPreset === preset ? 'bg-[#214f35] text-white' : 'text-slate-600 hover:bg-slate-50',
                )}
              >
                {preset}
              </button>
            ))}
          </div>
          <label className="grid gap-1 text-xs font-bold text-slate-500 sm:flex sm:items-center sm:gap-2">
            From
            <input type="date" value={reportFromDate} max={reportToDate} onChange={(event) => setReportFromDate(event.target.value)} className="interactive-ring h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink sm:w-auto" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500 sm:flex sm:items-center sm:gap-2">
            To
            <input type="date" value={reportToDate} min={reportFromDate} onChange={(event) => setReportToDate(event.target.value)} className="interactive-ring h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink sm:w-auto" />
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500 sm:flex sm:items-center sm:gap-2">
            Type
            <select value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value); setItemFilter('All'); }} className="interactive-ring h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink sm:w-auto">
              {types.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-bold text-slate-500 sm:flex sm:items-center sm:gap-2">
            Item
            <select value={itemFilter} onChange={(event) => setItemFilter(event.target.value)} className="interactive-ring h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-ink sm:w-auto">
              <option value="All">All items</option>
              {activeReportItems.filter((item) => typeFilter === 'All' || (item.itemType === 'consumable' ? 'Consumable' : 'Reusable') === typeFilter).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => window.print()} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-700 hover:bg-slate-200 sm:w-auto">
            <Printer className="h-3.5 w-3.5" />
            Print
          </button>
          <button type="button" onClick={handleExportReport} className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-[#eaf4ef] px-3 text-xs font-bold text-[#214f35] hover:bg-[#dceee4] sm:w-auto">
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>
      </div>

      <div className="admin-print-report inventory-print-report inventory-formal-report rounded-[16px] border border-white/80 bg-white p-4 text-ink shadow-card sm:p-5">
        <header className="admin-report-letterhead inventory-report-letterhead border-b border-slate-200 pb-5">
          <div className="flex justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={logoImage} alt="Watikolo logo" className="h-14 w-14 rounded-full object-contain ring-1 ring-slate-200 sm:h-16 sm:w-16" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500">Watikolo Event Venue Rental</p>
                <h2 className="mt-1 text-xl font-bold leading-tight text-ink sm:text-2xl">Official Inventory Report</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">Purok 4 Upper Puntod Road, Tabalong, Dauis, Bohol</p>
                <p className="mt-2 text-xs font-semibold text-ink">As of: {displayCoverageLabel}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <div className="rounded-[12px] border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Report No.</p>
              <p className="mt-1 text-sm font-bold text-ink">{reportNumber}</p>
            </div>
            <div className="rounded-[12px] border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Total Items</p>
              <p className="mt-1 text-sm font-bold text-ink">{summary.totalItems}</p>
            </div>
            <div className="rounded-[12px] border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">In Stock</p>
              <p className="mt-1 text-sm font-bold text-ink">{summary.inStock}</p>
            </div>
            <div className="rounded-[12px] border border-slate-100 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Needs Attention</p>
              <p className="mt-1 text-sm font-bold text-ink">{summary.lowStock + summary.critical}</p>
            </div>
          </div>
        </header>

        <div className="mt-5 overflow-hidden rounded-[12px] border border-slate-100">
          <div className="admin-print-table-wrap inventory-table-wrap overflow-x-auto">
            <table className="admin-print-table inventory-formal-table min-w-[680px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                {['Item', 'Type', 'Stock', 'Used', 'Available', 'Status'].map((heading) => (
                  <th key={heading} className={cn('px-3 py-3', ['Stock', 'Used', 'Available'].includes(heading) ? 'text-right' : 'text-left')}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reportRows.map((row) => (
                <tr key={row.item.id} className="align-top text-slate-600">
                  <td className="px-3 py-3 font-semibold text-ink">{row.item.name}</td>
                  <td className="px-3 py-3 text-slate-600">{row.item.itemType === 'consumable' ? 'Consumable' : 'Reusable'}</td>
                  <td className="px-3 py-3 text-right">{row.stockQuantity}</td>
                  <td className="px-3 py-3 text-right">{row.usedQuantity}</td>
                  <td className="px-3 py-3 text-right font-semibold text-ink">{row.remainingStock}</td>
                  <td className="px-3 py-3 text-left">
                    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold', reportStatusClasses(row.displayStatus))}>
                      {row.displayStatus}
                    </span>
                  </td>
                </tr>
              ))}
              {reportRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No inventory items found for this report.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
          </div>
        </div>

        <div className="mt-5 rounded-[12px] border border-slate-100 bg-slate-50 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Remarks</p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
              Low and critical items should be restocked immediately to ensure the smooth operation of upcoming bookings and events.
          </p>
        </div>

        <div className="admin-report-signatures mt-10 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Prepared by</p>
            <p className="admin-signature-name mt-12 text-sm font-semibold text-ink">Watikolo Admin Staff</p>
          </div>
          <div>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Approved by</p>
            <p className="admin-signature-name mt-12 text-sm font-semibold text-ink">Watikolo Management</p>
          </div>
        </div>
      </div>
    </div>
  );
}
