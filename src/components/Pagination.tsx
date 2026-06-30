"use client";

interface Props {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: Props) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition"
      >Prev</button>
      {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
        const p = totalPages <= 5 ? i + 1 : Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-xl text-xs font-semibold transition ${
              p === page
                ? "bg-primary-600 text-white shadow-sm"
                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >{p}</button>
        );
      })}
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 disabled:opacity-30 hover:bg-slate-50 transition"
      >Next</button>
    </div>
  );
}
