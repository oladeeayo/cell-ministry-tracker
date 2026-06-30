"use client";

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

interface SundayData {
  date: string;
  present: number;
  total: number;
}

interface Props {
  data: SundayData[];
}

function rateColor(present: number, total: number): string {
  if (total === 0) return "bg-slate-100";
  const r = present / total;
  if (r >= 0.7) return "bg-primary-500";
  if (r >= 0.4) return "bg-amber-400";
  return "bg-red-300";
}

export default function AttendanceCalendar({ data }: Props) {
  if (!data || data.length === 0) return null;

  return (
    <div className="card">
      <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 text-center">Attendance Calendar</h3>
      <p className="text-xs text-slate-400 mb-4 text-center">Sundays colored by turnout</p>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {data.map((s) => {
          const rate = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
          return (
            <div key={s.date} className="flex flex-col items-center gap-1 w-20 sm:w-24">
              <div className={`w-full aspect-square rounded-xl ${rateColor(s.present, s.total)} flex items-center justify-center text-white text-xs sm:text-sm font-bold`}>
                {s.present}
              </div>
              <span className="text-[10px] text-slate-400 text-center">{formatDate(s.date)}</span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary-500 inline-block" /> &ge;70%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-400 inline-block" /> 40-69%</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-300 inline-block" /> &lt;40%</span>
      </div>
    </div>
  );
}
