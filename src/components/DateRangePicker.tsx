"use client";

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export default function DateRangePicker({ from, to, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 max-w-full">
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="form-input !py-1 !px-1.5 sm:!py-1.5 sm:!px-3 !w-auto !min-w-0 !max-w-[100px] sm:!max-w-[140px] text-[10px] sm:text-xs"
      />
      <span className="text-slate-300 text-[10px] hidden sm:inline">&ndash;</span>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="form-input !py-1 !px-1.5 sm:!py-1.5 sm:!px-3 !w-auto !min-w-0 !max-w-[100px] sm:!max-w-[140px] text-[10px] sm:text-xs"
      />
    </div>
  );
}
