import { cn } from '@/utils/cn';

interface TabItem {
  label: string;
  value: string;
}

interface TabsProps {
  items: TabItem[];
  activeValue: string;
  onChange: (value: string) => void;
}

export function Tabs({ items, activeValue, onChange }: TabsProps) {
  return (
    <div className="inline-flex rounded-full bg-white p-1 shadow-card">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'rounded-full px-4 py-2 text-sm font-medium transition',
            activeValue === item.value ? 'bg-ink text-white' : 'text-slate-600 hover:text-ink',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
