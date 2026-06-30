"use client";

interface Props {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
}

export default function DateRangePicker({ from, to, onChange }: Props) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <label className="text-gray-500 font-medium">From:</label>
      <input type="date" value={from} onChange={(e) => onChange(e.target.value, to)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      <label className="text-gray-500 font-medium">To:</label>
      <input type="date" value={to} onChange={(e) => onChange(from, e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
    </div>
  );
}
