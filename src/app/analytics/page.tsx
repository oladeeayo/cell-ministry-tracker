"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LayoutWrapper from "@/components/LayoutWrapper";
import AttendancePieChart from "@/components/AttendancePieChart";
import AttendanceCalendar from "@/components/AttendanceCalendar";
import DateRangePicker from "@/components/DateRangePicker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from "recharts";

function formatDate(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }); }
function getMonthRange() {
  const n = new Date();
  return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0], to: n.toISOString().split("T")[0] };
}

function AnalyticsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const role = user?.role;

  const [stats, setStats] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getMonthRange());

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchData = async () => {
    if (status !== "authenticated") return;
    try {
      if (["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(role)) {
        const res = await fetch(`/api/dashboard/overview?from=${dateRange.from}&to=${dateRange.to}`);
        const data = await res.json();
        setStats(data.stats);
        setZones(data.zones || []);
        setWeeklyTrend(data.weeklyTrend || []);
      } else {
        const res = await fetch(`/api/user-meta?userId=${user.id}`);
        const meta = await res.json();
        if (meta.cellId) {
          const cellRes = await fetch(`/api/dashboard/cell/${meta.cellId}?from=${dateRange.from}&to=${dateRange.to}`);
          const data = await cellRes.json();
          setStats(data);
          setWeeklyTrend(data.weeklyTrend || []);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [status, dateRange.from, dateRange.to]);

  if (status === "loading" || loading) {
    return <LayoutWrapper pageTitle="Analytics"><div className="flex items-center justify-center py-20"><div className="text-slate-400">Loading analytics...</div></div></LayoutWrapper>;
  }
  if (!user || status !== "authenticated") return null;

  return (
    <LayoutWrapper pageTitle="Analytics">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Analytics</h2>
            <p className="text-sm text-slate-500 mt-1">Historical trends and performance metrics</p>
          </div>
          <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
        </div>

        {/* KPI Summary */}
        {stats && ["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(role) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: "Total Zones", value: stats.totalZones, color: "primary" },
              { label: "Total Cells", value: stats.totalCells, color: "blue" },
              { label: "Total Members", value: stats.totalMembers, color: "amber" },
              { label: "MoM Growth", value: `${(stats.momGrowth || 0) >= 0 ? "+" : ""}${stats.momGrowth}%`, color: "green" },
            ].map((kpi, i) => (
              <div key={i} className="card-compact text-center">
                <p className="text-xs text-slate-500 font-medium mb-2">{kpi.label}</p>
                <p className={`text-2xl sm:text-3xl font-bold ${kpi.color === "green" ? ((stats.momGrowth || 0) >= 0 ? "text-green-600" : "text-red-500") : "text-slate-900"}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        )}

        {stats && !["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(role) && stats.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { label: "Members", value: stats.members?.length || 0, color: "amber" },
              { label: "Avg Rate", value: `${stats.stats?.attendanceRate || 0}%`, color: "blue" },
              { label: "Present (Last Sun)", value: stats.stats?.presentThisSunday || 0, color: "primary" },
            ].map((kpi, i) => (
              <div key={i} className="card-compact text-center">
                <p className="text-xs text-slate-500 font-medium mb-2">{kpi.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-slate-900">{kpi.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {weeklyTrend.length > 0 && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Attendance Trend</h3>
              <p className="text-xs text-slate-400 mb-6">Weekly attendance over time</p>
              <ResponsiveContainer width="100%" height={260}>
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

          {zones.length > 0 && (
            <div className="card">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Zone Comparison</h3>
              <p className="text-xs text-slate-400 mb-6">Present attendance by zone</p>
              <ResponsiveContainer width="100%" height={260}>
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

        {/* Pie + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats && ["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(role) && (
            <AttendancePieChart present={stats.presentThisSunday || 0} absent={(stats.totalMembers || 0) - (stats.presentThisSunday || 0)} />
          )}
          {stats && !["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(role) && stats.members && (
            <AttendancePieChart
              present={stats.members.filter((m: any) => m.attendance?.[stats.sundays?.[stats.sundays.length - 1]]?.present).length}
              absent={stats.members.filter((m: any) => !m.attendance?.[stats.sundays?.[stats.sundays.length - 1]]?.present).length}
            />
          )}
          {weeklyTrend.length > 0 && <AttendanceCalendar data={weeklyTrend.map((w: any) => ({ ...w, total: stats?.totalMembers || stats?.members?.length || 0 }))} />}
        </div>

        {/* Zone Rate Table */}
        {zones.length > 0 && (
          <div className="card !p-0 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Zone Performance</h3>
              <p className="text-xs text-slate-400 mt-0.5">Attendance rates across zones</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Zone</th>
                    <th className="text-left px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Leader</th>
                    <th className="text-center px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Cells</th>
                    <th className="text-center px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Members</th>
                    <th className="text-center px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Present</th>
                    <th className="text-center px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {zones.map((z: any) => (
                    <tr key={z.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-slate-900 text-xs sm:text-sm">Zone {z.zoneNumber}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-slate-600 text-xs sm:text-sm">{z.zonalLeader}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-800">{z.totalCells}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-slate-800">{z.totalMembers}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm text-primary-600">{z.presentThisSunday}</td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${z.attendanceRate >= 70 ? "badge-success" : z.attendanceRate >= 40 ? "badge-pending" : "badge-danger"}`}>{z.attendanceRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </LayoutWrapper>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="text-slate-400">Loading...</div></div>}>
      <AnalyticsContent />
    </Suspense>
  );
}
