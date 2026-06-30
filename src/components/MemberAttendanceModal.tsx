"use client";

import { useState, useEffect } from "react";

interface Props {
  memberId: number;
  memberName: string;
  onClose: () => void;
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function MemberAttendanceModal({ memberId, memberName, onClose }: Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/members/${memberId}/attendance`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [memberId]);

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 sm:py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{memberName}</h3>
            {data && <p className="text-xs text-slate-400 mt-0.5">{data.member.role} &middot; {data.member.phone || "No phone"}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="text-slate-400">Loading attendance...</div></div>
        ) : data ? (
          <div className="px-6 sm:px-8 py-5 sm:py-6 space-y-6">
            {/* Overall Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card-compact !p-4 text-center">
                <p className="text-2xl font-bold text-primary-600">{data.overallRate}%</p>
                <p className="text-xs text-slate-400 mt-1">Attendance Rate</p>
              </div>
              <div className="card-compact !p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{data.totalPresent}</p>
                <p className="text-xs text-slate-400 mt-1">Present</p>
              </div>
              <div className="card-compact !p-4 text-center">
                <p className="text-2xl font-bold text-red-500">{data.totalAbsent}</p>
                <p className="text-xs text-slate-400 mt-1">Absent</p>
              </div>
            </div>

            {/* Monthly Breakdown */}
            {Object.keys(data.attendanceByMonth).length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3">Monthly Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(data.attendanceByMonth as Record<string, { present: number; absent: number; total: number }>).map(([month, stats]) => (
                    <div key={month} className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl">
                      <span className="text-sm font-medium text-slate-700">{month}</span>
                      <div className="flex items-center gap-4 text-xs font-semibold">
                        <span className="text-green-600">{stats.present} present</span>
                        <span className="text-red-400">{stats.absent} absent</span>
                        <span className={`px-2 py-0.5 rounded-lg text-xs ${
                          stats.present >= stats.absent ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"
                        }`}>{Math.round((stats.present / stats.total) * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Records */}
            {data.records.length > 0 && (
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3">All Records</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50">
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Date</th>
                        <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.records.map((r: any) => (
                        <tr key={r.date} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-700 text-xs sm:text-sm whitespace-nowrap">{formatDate(r.date)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold ${
                              r.isPresent ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${r.isPresent ? "bg-green-500" : "bg-slate-400"}`} />
                              {r.isPresent ? "Present" : "Absent"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-400 text-xs">{r.note || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">Failed to load attendance data.</div>
        )}
      </div>
    </div>
  );
}
