"use client";

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export default function DateRangePicker({ from, to, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="text-xs font-semibold text-slate-400">From:</label>
      <input
        type="date"
        value={from}
        onChange={(e) => onChange(e.target.value, to)}
        className="form-input !py-1.5 !px-3 !w-auto !min-w-[130px] text-xs"
      />
      <label className="text-xs font-semibold text-slate-400">To:</label>
      <input
        type="date"
        value={to}
        onChange={(e) => onChange(from, e.target.value)}
        className="form-input !py-1.5 !px-3 !w-auto !min-w-[130px] text-xs"
      />
    </div>
  );
}
