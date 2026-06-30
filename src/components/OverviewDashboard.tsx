"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import DateRangePicker from "./DateRangePicker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

interface Props { userRole: string; }

function formatDate(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }); }
function getMonthRange() {
  const n = new Date();
  return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0], to: n.toISOString().split("T")[0] };
}

export default function OverviewDashboard({ userRole }: Props) {
  const [stats, setStats] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getMonthRange());
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/overview?from=${dateRange.from}&to=${dateRange.to}`);
      const data = await res.json();
      setStats(data.stats);
      setZones(data.zones || []);
      setWeeklyTrend(data.weeklyTrend || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [dateRange.from, dateRange.to]);

  const filteredZones = zones.filter((z) => !search || z.zoneNumber.toString().includes(search) || z.zonalLeader.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-slate-400">Loading overview...</div></div>;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="card relative overflow-hidden !p-0 !border-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-white/5 translate-y-1/2" />
        <div className="relative p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold">Welcome to Cell Ministry</h2>
          <p className="text-primary-100 text-sm mt-2 max-w-xl">Track attendance, manage members, and gain insights across all zones and cells in your ministry.</p>
          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/register" className="px-5 py-2.5 bg-white text-primary-700 rounded-xl font-semibold text-sm hover:bg-primary-50 transition inline-flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
              Register Member
            </Link>

          </div>
        </div>
      </div>

      {/* Date Range */}
      <div className="flex items-center justify-end">
        <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: "Zones", value: stats.totalZones, icon: "smile", color: "primary" },
            { label: "Cells", value: stats.totalCells, sub: `${stats.cellsWithSubmission} submitted attendance`, icon: "zap", color: "blue" },
            { label: "Members", value: stats.totalMembers, sub: `${stats.presentThisSunday} present this Sunday`, icon: "users", color: "amber" },
            { label: "MoM Growth", value: `${(stats.momGrowth || 0) >= 0 ? "+" : ""}${stats.momGrowth}%`, sub: "vs previous month", icon: "trending", color: "green" },
          ].map((kpi, i) => (
            <div key={i} className="card-compact text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  kpi.color === "primary" ? "bg-primary-50" : kpi.color === "blue" ? "bg-blue-50" : kpi.color === "amber" ? "bg-amber-50" : "bg-green-50"
                }`}>
                  {kpi.icon === "smile" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={kpi.color === "primary" ? "#0d9488" : kpi.color === "blue" ? "#0ea5e9" : kpi.color === "amber" ? "#f59e0b" : "#10b981"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/></svg>}
                  {kpi.icon === "zap" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
                  {kpi.icon === "users" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                  {kpi.icon === "trending" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>}
                </div>
                <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
              </div>
              <p className={`text-3xl font-bold ${i === 3 ? ((stats.momGrowth || 0) >= 0 ? "text-green-600" : "text-red-500") : "text-slate-900"}`}>
                {kpi.value}
              </p>
              {kpi.sub && <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Trend */}
        {weeklyTrend.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Growth Trajectory</h3>
            <p className="text-xs text-slate-400 mb-6">4-week attendance trend</p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={weeklyTrend.map((w) => ({ name: formatDate(w.date), present: w.present }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }} />
                <Line type="monotone" dataKey="present" stroke="#0d9488" strokeWidth={3} dot={{ fill: "#0d9488", strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: "#0d9488" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Zone Comparison */}
        {zones.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Zone Comparison</h3>
            <p className="text-xs text-slate-400 mb-6">Present attendance by zone</p>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={zones.map((z) => ({ name: `Zone ${z.zoneNumber}`, present: z.presentThisSunday, rate: z.attendanceRate }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                <Bar dataKey="present" fill="#0d9488" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Zone Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Live Cell Reports</h3>
            <p className="text-xs text-slate-400 mt-0.5">Performance overview across all zones</p>
          </div>
          <input type="text" placeholder="Search zone or leader..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input !w-56" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                {["Zone", "Zonal Leader", "Cells", "Members", "Last Sunday", "Attendance", "Rate"].map((h) => (
                  <th key={h} className="text-left px-6 py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredZones.map((z: any) => (
                <tr key={z.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4">
                    <Link href={`/dashboard?zone=${z.id}`} className="font-semibold text-slate-900 hover:text-primary-600 transition">Zone {z.zoneNumber}</Link>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{z.zonalLeader}</td>
                  <td className="px-6 py-4"><span className="font-medium text-slate-800">{z.totalCells}</span></td>
                  <td className="px-6 py-4"><span className="font-medium text-slate-800">{z.totalMembers}</span></td>
                  <td className="px-6 py-4"><span className="font-medium text-primary-600">{z.presentThisSunday}</span></td>
                  <td className="px-6 py-4"><span className="font-medium text-slate-700">{z.attendanceInRange}</span></td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      z.attendanceRate >= 70 ? "badge-success" : z.attendanceRate >= 40 ? "badge-pending" : "badge-danger"
                    }`}>{z.attendanceRate}%</span>
                  </td>
                </tr>
              ))}
              {filteredZones.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">No zones found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
