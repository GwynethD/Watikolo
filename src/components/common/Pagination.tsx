import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onChange }: PaginationProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-card">
      <button
        onClick={() => onChange(Math.max(1, currentPage - 1))}
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <p className="text-sm text-slate-500">
        Page {currentPage} of {totalPages}
      </p>
      <button
        onClick={() => onChange(Math.min(totalPages, currentPage + 1))}
        className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
