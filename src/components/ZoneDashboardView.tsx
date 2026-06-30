"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DateRangePicker from "./DateRangePicker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

interface Props { zoneId: number; userRole: string; }

function formatDate(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }); }
function getMonthRange() {
  const n = new Date();
  return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0], to: n.toISOString().split("T")[0] };
}

export default function ZoneDashboardView({ zoneId, userRole }: Props) {
  const [zone, setZone] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [cellStats, setCellStats] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getMonthRange());
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/zone/${zoneId}?from=${dateRange.from}&to=${dateRange.to}`);
      const data = await res.json();
      setZone(data.zone);
      setStats(data.stats);
      setCellStats(data.cellStats || []);
      setWeeklyTrend(data.weeklyTrend || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [zoneId, dateRange.from, dateRange.to]);

  const filteredCells = cellStats.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-slate-400">Loading zone dashboard...</div></div>;
  if (!zone) return <div className="card-compact text-center py-12"><p className="text-slate-400">Zone not found.</p></div>;

  return (
    <div className="space-y-8">
      {/* Zone Header */}
      <div className="card relative overflow-hidden bg-gradient-to-br from-primary-600 to-primary-800 text-white !border-0 !p-0">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="relative p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-bold truncate pr-4">Zone {zone.zoneNumber} — {zone.name}</h2>
              <p className="text-primary-100 text-xs sm:text-sm mt-1 truncate">Zonal Leader: {zone.zonalLeader?.name || "N/A"}</p>
            </div>
            <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: "Cells", value: stats.totalCells, color: "primary" },
            { label: "Members", value: stats.totalMembers, color: "amber" },
            { label: "Present (Last Sun)", value: stats.presentThisSunday, color: "blue", highlight: "text-primary-600" },
            { label: "MoM Growth", value: `${(stats.momGrowth || 0) >= 0 ? "+" : ""}${stats.momGrowth}%`, color: "green", highlight: (stats.momGrowth || 0) >= 0 ? "text-green-600" : "text-red-500" },
          ].map((kpi, i) => (
            <div key={i} className="card-compact text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  kpi.color === "primary" ? "bg-primary-50" : kpi.color === "amber" ? "bg-amber-50" : kpi.color === "blue" ? "bg-blue-50" : "bg-green-50"
                }`}>
                  {kpi.color === "primary" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                  {kpi.color === "amber" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                  {kpi.color === "blue" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                  {kpi.color === "green" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                </div>
                <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold truncate ${kpi.highlight || "text-slate-900"}`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {weeklyTrend.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Attendance Trend</h3>
          <p className="text-xs text-slate-400 mb-6">Weekly attendance overview</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyTrend.map((w) => ({ name: formatDate(w.date), present: w.present }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
              <Line type="monotone" dataKey="present" stroke="#0d9488" strokeWidth={3} dot={{ fill: "#0d9488", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cell Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Cells ({cellStats.length})</h3>
            <p className="text-xs text-slate-400 mt-0.5">Performance across all cells in this zone</p>
          </div>
          <input type="text" placeholder="Search cell..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input !w-full sm:!w-48" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {["Cell", "Leader", "Members", "Sunday", "Att.", "Rate"].map((h) => (
                  <th key={h} className="text-left px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredCells.map((c: any) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <Link href={`/dashboard?cell=${c.id}`} className="font-semibold text-slate-900 hover:text-primary-600 transition text-xs sm:text-sm whitespace-nowrap">{c.name}</Link>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-none">{c.leaderName}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4"><span className="font-medium text-slate-800 text-xs sm:text-sm">{c.totalMembers}</span></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4"><span className="font-medium text-primary-600 text-xs sm:text-sm">{c.presentThisSunday}</span></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4"><span className="font-medium text-slate-700 text-xs sm:text-sm">{c.attendanceInRange}</span></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      c.attendanceRate >= 70 ? "badge-success" : c.attendanceRate >= 40 ? "badge-pending" : "badge-danger"
                    }`}>{c.attendanceRate}%</span>
                  </td>
                </tr>
              ))}
              {filteredCells.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-slate-400">No cells found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
