import type { ReactNode } from 'react';

interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  compact?: boolean;
}

export function DataTable<T>({ columns, data, compact = false }: DataTableProps<T>) {
  return (
    <div className={compact ? 'overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-card' : 'overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-card sm:rounded-3xl'}>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className={compact ? 'min-w-[860px] divide-y divide-slate-200 text-left text-xs' : 'min-w-[720px] divide-y divide-slate-200 text-left sm:min-w-full'}>
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={compact ? 'px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-500' : 'px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 sm:px-5 sm:py-4 sm:text-xs sm:tracking-[0.18em]'}>
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td key={column.key} className={compact ? 'px-2 py-1.5 align-top text-xs text-slate-700' : 'px-3 py-3 align-top text-sm text-slate-700 sm:px-5 sm:py-4'}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
