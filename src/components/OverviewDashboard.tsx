"use client";

import { useState, useEffect } from "react";
import DateRangePicker from "./DateRangePicker";
import AttendancePieChart from "./AttendancePieChart";
import AttendanceCalendar from "./AttendanceCalendar";
import Link from "next/link";
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
  const printReport = () => window.print();
  const monthName = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  if (loading) return <div className="flex items-center justify-center py-20"><div className="text-slate-400">Loading overview...</div></div>;

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white rounded-3xl p-8 flex items-center justify-between shadow-sm">
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold">{greeting}, Pastor.</h2>
          <p className="text-primary-100 mt-2 max-w-lg">Your ministry overview for <strong>{monthName}</strong> shows healthy growth across all zones.</p>
          {stats && (
            <div className="mt-8 grid grid-cols-3 gap-8">
              <div>
                <div className="text-xs font-bold text-primary-200 uppercase tracking-widest mb-1">Active Cells</div>
                <div className="text-3xl font-extrabold">{stats.totalCells}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-primary-200 uppercase tracking-widest mb-1">Total Members</div>
                <div className="text-3xl font-extrabold">{stats.totalMembers}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-primary-200 uppercase tracking-widest mb-1">Growth</div>
                <div className={`text-3xl font-extrabold ${(stats.momGrowth || 0) >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                  {(stats.momGrowth || 0) >= 0 ? "+" : ""}{stats.momGrowth}%
                </div>
              </div>
            </div>
          )}
        </div>
        <button onClick={printReport} className="btn-secondary !py-1.5 sm:!py-2 !px-2.5 sm:!px-4 !text-[10px] sm:!text-xs bg-white/15 text-white border-white/20 hover:bg-white/25 shrink-0 print:hidden self-start">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          Print
        </button>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a href="/register" className="group block bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Register Member</h3>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">Onboard new members and assign them to cells and E-groups.</p>
          <div className="mt-6 flex items-center text-teal-600 font-bold text-sm uppercase tracking-wider">
            Register Now <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </a>

        <a href="/dashboard" className="group block bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:bg-orange-600 group-hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Mark Attendance</h3>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">Submit weekly reports and track individual member presence.</p>
          <div className="mt-6 flex items-center text-orange-600 font-bold text-sm uppercase tracking-wider">
            Open Attendance <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </a>

        <a href="/analytics" className="group block bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-teal-500/5 hover:-translate-y-1 transition-all duration-300">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <h3 className="text-xl font-bold text-slate-900">Ministry Insights</h3>
          <p className="text-slate-500 mt-2 text-sm leading-relaxed">Analyze retention, MoM growth, and zonal leaderboard metrics.</p>
          <div className="mt-6 flex items-center text-blue-600 font-bold text-sm uppercase tracking-wider">
            Deep Analysis <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </div>
        </a>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {weeklyTrend.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Growth Trajectory</h3>
                <p className="text-sm text-slate-500">Weekly attendance trend</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
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

        {zones.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Zonal Submissions</h3>
                <p className="text-sm text-slate-500">Latest Sunday cell reporting status</p>
              </div>
            </div>
            <div className="space-y-4">
              {zones.slice(0, 6).map((z: any) => {
                const ratio = z.cellsWithSubmission ?? z.totalCells;
                const pct = z.totalCells > 0 ? Math.round((ratio / z.totalCells) * 100) : 0;
                const done = pct >= 100;
                const partial = pct > 0;
                return (
                  <div key={z.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-100 shadow-sm shrink-0 ${done ? "text-teal-600" : partial ? "text-amber-500" : "text-slate-300"}`}>
                        {done ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                        ) : partial ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" x2="9" y1="9" y2="15"/><line x1="9" x2="15" y1="9" y2="15"/></svg>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">Zone {z.zoneNumber}: {z.zonalLeader?.split(" ")[0] || "N/A"}</div>
                        <div className="text-xs text-slate-500">{z.cellsWithSubmission || 0}/{z.totalCells} Cells Reported</div>
                      </div>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full ${done ? "text-teal-600 bg-teal-50" : partial ? "text-amber-600 bg-amber-50" : "text-slate-400 bg-slate-100"}`}>
                      {done ? "COMPLETED" : partial ? "PENDING" : "NO DATA"}
                    </span>
                  </div>
                );
              })}
              {zones.length > 6 && <p className="text-xs text-slate-400 text-center pt-2">+{zones.length - 6} more zones</p>}
            </div>
          </div>
        )}
      </div>

      {/* Pie + Calendar */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AttendancePieChart present={stats.presentThisSunday || 0} absent={(stats.totalMembers || 0) - (stats.presentThisSunday || 0)} />
          {weeklyTrend.length > 0 && <AttendanceCalendar data={weeklyTrend.map((w: any) => ({ ...w, total: stats.totalMembers || 0 }))} />}
        </div>
      )}

      {/* Zone Table */}
      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Live Cell Reports</h3>
            <p className="text-xs text-slate-400 mt-0.5">Performance overview across all zones</p>
          </div>
          <input type="text" placeholder="Search zone or leader..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input !w-full sm:!w-56" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/50">
                {[{ label: "Zone", align: "text-left", sticky: "sticky left-0 z-10 bg-slate-50/50" }, { label: "Leader", align: "text-left", sticky: "sticky left-[100px] z-10 bg-slate-50/50" }, { label: "Cells", align: "text-center", sticky: "" }, { label: "Members", align: "text-center", sticky: "" }, { label: "Sunday", align: "text-center", sticky: "" }, { label: "Att.", align: "text-center", sticky: "" }, { label: "Rate", align: "text-center", sticky: "" }].map((h) => (
                  <th key={h.label} className={`${h.align} ${h.sticky} px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap`}>{h.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredZones.map((z: any) => (
                <tr key={z.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-3 sm:px-6 py-3 sm:py-4 sticky left-0 z-10 bg-white sm:static sm:z-auto">
                    <Link href={`/dashboard?zone=${z.id}`} className="font-semibold text-slate-900 hover:text-primary-600 transition text-xs sm:text-sm whitespace-nowrap">Zone {z.zoneNumber}</Link>
                  </td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 text-xs sm:text-sm whitespace-nowrap sticky left-[80px] z-10 bg-white sm:static sm:z-auto">{z.zonalLeader}</td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-center"><span className="font-medium text-slate-800 text-xs sm:text-sm">{z.totalCells}</span></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-center"><span className="font-medium text-slate-800 text-xs sm:text-sm">{z.totalMembers}</span></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-center"><span className="font-medium text-primary-600 text-xs sm:text-sm">{z.presentThisSunday}</span></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-center"><span className="font-medium text-slate-700 text-xs sm:text-sm">{z.attendanceInRange}</span></td>
                  <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
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
