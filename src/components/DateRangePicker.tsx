"use client";

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export default function DateRangePicker({ from, to, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
      <label className="text-[10px] sm:text-xs font-semibold text-slate-400 hidden sm:inline">From:</label>
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="form-input !py-1 sm:!py-1.5 !px-2 sm:!px-3 !w-auto !min-w-0 !max-w-[120px] sm:!min-w-[130px] text-[10px] sm:text-xs"
      />
      <label className="text-[10px] sm:text-xs font-semibold text-slate-400 hidden sm:inline">To:</label>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="form-input !py-1 sm:!py-1.5 !px-2 sm:!px-3 !w-auto !min-w-0 !max-w-[120px] sm:!min-w-[130px] text-[10px] sm:text-xs"
      />
    </div>
  );
}
