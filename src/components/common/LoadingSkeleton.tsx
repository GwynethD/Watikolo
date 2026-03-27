export function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="panel animate-pulse p-5">
          <div className="h-48 rounded-3xl bg-slate-200" />
          <div className="mt-5 h-4 rounded-full bg-slate-200" />
          <div className="mt-3 h-4 w-2/3 rounded-full bg-slate-200" />
          <div className="mt-6 h-10 rounded-full bg-slate-200" />
        </div>
      ))}
    </div>
  );
}
