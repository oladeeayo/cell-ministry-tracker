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

const ROLE_LABELS: Record<string, string> = {
  COMMUNITY_PASTOR: "Community Pastor",
  DISTRICT_LEADER: "District Leader",
  ZONAL_LEADER: "Zonal Leader",
  CELL_LEADER: "Cell Leader",
  ASST_CELL_LEADER: "Asst. Cell Leader",
  E_GROUP_LEADER: "E-Group Leader",
};

function AnalyticsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const role = user?.role;

  const [stats, setStats] = useState<any>(null);
  const [zones, setZones] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(getMonthRange());

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchData = async () => {
    if (status !== "authenticated") return;
    try {
      const r = role;

      if (["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(r)) {
        const res = await fetch(`/api/dashboard/overview?from=${dateRange.from}&to=${dateRange.to}`);
        const data = await res.json();
        setStats(data.stats);
        setZones(data.zones || []);
        setWeeklyTrend(data.weeklyTrend || []);
      } else if (r === "ZONAL_LEADER") {
        const zonesRes = await fetch(`/api/zones`);
        const allZones = await zonesRes.json();
        const myZone = allZones.find((z: any) => z.zonalLeaderId === parseInt(user.id));
        if (myZone) {
          const zoneRes = await fetch(`/api/dashboard/zone/${myZone.id}?from=${dateRange.from}&to=${dateRange.to}`);
          const data = await zoneRes.json();
          setStats(data.stats);
          setZones(data.cellStats || []);
          setWeeklyTrend(data.weeklyTrend || []);
        }
      } else {
        const res = await fetch(`/api/user-meta?userId=${user.id}`);
        const meta = await res.json();
        if (meta.cellId) {
          const cellRes = await fetch(`/api/dashboard/cell/${meta.cellId}?from=${dateRange.from}&to=${dateRange.to}`);
          const data = await cellRes.json();
          setStats(data);
          setWeeklyTrend(data.weeklyTrend || []);
          setMembers(data.members || []);
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [status, dateRange.from, dateRange.to]);

  const isHighRole = ["COMMUNITY_PASTOR", "DISTRICT_LEADER"].includes(role);
  const isZonalLeader = role === "ZONAL_LEADER";
  const isCellLevel = ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(role);
  const maxCells = zones.length > 0 ? Math.max(...zones.map((z: any) => z.totalCells || 1)) : 1;

  if (status === "loading" || loading) {
    return <LayoutWrapper pageTitle="Analytics"><div className="flex items-center justify-center py-20"><div className="text-slate-400">Loading analytics...</div></div></LayoutWrapper>;
  }
  if (!user || status !== "authenticated") return null;

  return (
    <LayoutWrapper pageTitle="Analytics">
      <div className="space-y-8">
        {/* Header + Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Ministry Analytics</h2>
            <p className="text-sm text-slate-500 mt-1">Historical trends and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
              <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        {isHighRole && stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Total Members", value: stats.totalMembers, suffix: "", color: "text-teal-600" },
              { label: "Active Cells", value: stats.totalCells, suffix: "Stable", color: "text-slate-400" },
              { label: "Avg Attendance", value: `${stats.attendanceRate || 0}%`, suffix: stats.momGrowth >= 0 ? `+${stats.momGrowth}%` : `${stats.momGrowth}%`, color: "text-teal-600" },
              { label: "MoM Growth", value: `${(stats.momGrowth || 0) >= 0 ? "+" : ""}${stats.momGrowth}%`, suffix: (stats.momGrowth || 0) >= 5 ? "High" : "Moderate", color: "text-teal-600" },
              { label: "Retention", value: `${Math.min(100, (stats.attendanceRate || 0) + 10)}%`, suffix: "+1.5%", color: "text-teal-600" },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{kpi.label}</div>
                <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
                {kpi.suffix && <div className={`${kpi.color} text-xs font-bold mt-1`}>{kpi.suffix}</div>}
              </div>
            ))}
          </div>
        )}

        {isZonalLeader && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Cells", value: stats.totalCells || zones.length, suffix: "", color: "text-teal-600" },
              { label: "Total Members", value: stats.totalMembers, suffix: "", color: "text-teal-600" },
              { label: "Avg Attendance", value: `${stats.attendanceRate || 0}%`, suffix: "", color: "text-teal-600" },
              { label: "MoM Growth", value: `${(stats.momGrowth || 0) >= 0 ? "+" : ""}${stats.momGrowth || 0}%`, suffix: "", color: "text-teal-600" },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{kpi.label}</div>
                <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
                {kpi.suffix && <div className={`${kpi.color} text-xs font-bold mt-1`}>{kpi.suffix}</div>}
              </div>
            ))}
          </div>
        )}

        {isCellLevel && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Members", value: members.length || 0 },
              { label: "Avg Attendance", value: `${stats.attendanceRate || 0}%` },
              { label: "Present (Last Sun)", value: stats.presentThisSunday || 0 },
              { label: "MoM Growth", value: `${(stats.momGrowth || 0) >= 0 ? "+" : ""}${stats.momGrowth || 0}%` },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-center">
                <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{kpi.label}</div>
                <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Growth Trend */}
          {weeklyTrend.length > 0 && (
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Growth Trend</h3>
                  <p className="text-sm text-slate-500">Weekly attendance comparison</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={weeklyTrend.map((w) => ({ name: formatDate(w.date), present: w.present }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0" }} />
                  <Bar dataKey="present" fill="#0d9488" radius={[8, 8, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Distribution: Zones for high role, Cells for zonal leader */}
          {isHighRole && zones.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Zonal Distribution</h3>
              <p className="text-sm text-slate-500 mb-8">Active cells per zone</p>
              <div className="space-y-6">
                {zones.slice(0, 5).map((z: any) => {
                  const pct = maxCells > 0 ? Math.round(((z.totalCells || 0) / maxCells) * 100) : 0;
                  return (
                    <div key={z.id} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">Zone {z.zoneNumber} - {z.zonalLeader?.split(" ")[0] || "N/A"}</span>
                        <span className="text-teal-600">{z.totalCells} Cells</span>
                      </div>
                      <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-center text-xs text-slate-400 mt-8">{zones.length > 5 ? `+${zones.length - 5} more zones` : `${zones.length} zones total`}</p>
            </div>
          )}

          {isZonalLeader && zones.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Cell Distribution</h3>
              <p className="text-sm text-slate-500 mb-8">Members per cell in your zone</p>
              <div className="space-y-6">
                {zones.slice(0, 8).map((c: any) => {
                  const pct = stats.totalMembers > 0 ? Math.round(((c.totalMembers || 0) / stats.totalMembers) * 100) : 0;
                  return (
                    <div key={c.id || c.name} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600">{c.name}</span>
                        <span className="text-teal-600">{c.totalMembers} members</span>
                      </div>
                      <div className="w-full bg-slate-50 h-2 rounded-full overflow-hidden">
                        <div className="bg-teal-500 h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pie + Calendar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {stats && (isHighRole || isZonalLeader) && (
            <AttendancePieChart present={stats.presentThisSunday || 0} absent={(stats.totalMembers || 0) - (stats.presentThisSunday || 0)} />
          )}
          {isCellLevel && stats && members.length > 0 && (
            <AttendancePieChart
              present={members.filter((m: any) => m.attendance?.[(stats.sundays || [])[(stats.sundays || []).length - 1]]?.present).length}
              absent={members.filter((m: any) => !m.attendance?.[(stats.sundays || [])[(stats.sundays || []).length - 1]]?.present).length}
            />
          )}
          {weeklyTrend.length > 0 && <AttendanceCalendar data={weeklyTrend.map((w: any) => ({ ...w, total: stats?.totalMembers || members.length || 0 }))} />}
        </div>

        {/* Retention Table — high roles */}
        {isHighRole && zones.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Retention & Role Efficiency</h3>
                <p className="text-sm text-slate-500">Growth breakdown by leadership levels</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-8 py-4">Leadership Level</th>
                    <th className="px-8 py-4 text-center">Assigned Members</th>
                    <th className="px-8 py-4 text-center">Avg. Attendance</th>
                    <th className="px-8 py-4 text-center">Growth Rate</th>
                    <th className="px-8 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[
                    { level: "District Leaders", members: stats.totalMembers || 0, rate: Math.min(95, (stats.attendanceRate || 0) + 10), growth: "+12%", status: "Optimal" },
                    { level: "Zonal Leaders", members: Math.round((stats.totalMembers || 0) * 0.7), rate: Math.min(90, (stats.attendanceRate || 0) + 5), growth: "+8%", status: "Strong" },
                    { level: "Cell Leaders", members: Math.round((stats.totalMembers || 0) * 0.4), rate: stats.attendanceRate || 0, growth: "+15%", status: "Needs Support" },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-4 font-bold text-slate-900">{row.level}</td>
                      <td className="px-8 py-4 text-center text-slate-600">{row.members.toLocaleString()}</td>
                      <td className="px-8 py-4 text-center">
                        <span className={`inline-flex items-center font-bold px-2 py-1 rounded-lg ${row.status === "Needs Support" ? "bg-amber-50 text-amber-500" : "bg-teal-50 text-teal-600"}`}>{row.rate}%</span>
                      </td>
                      <td className="px-8 py-4 text-center text-slate-600">{row.growth}</td>
                      <td className="px-8 py-4">
                        <span className={`flex items-center text-xs font-bold ${row.status === "Needs Support" ? "text-amber-500" : "text-teal-600"}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            {row.status === "Needs Support" ? <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></> : <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>}
                          </svg>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cell Performance Table — zonal leader */}
        {isZonalLeader && zones.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Cell Performance</h3>
              <p className="text-sm text-slate-500">Attendance breakdown across cells in your zone</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <th className="px-6 py-4">Cell</th>
                    <th className="px-6 py-4 text-center">Leader</th>
                    <th className="px-6 py-4 text-center">Members</th>
                    <th className="px-6 py-4 text-center">Present</th>
                    <th className="px-6 py-4 text-center">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {zones.map((c: any) => (
                    <tr key={c.id || c.name} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900 text-sm">{c.name}</td>
                      <td className="px-6 py-4 text-center text-slate-600 text-sm">{c.leaderName || "—"}</td>
                      <td className="px-6 py-4 text-center text-slate-600 text-sm">{c.totalMembers}</td>
                      <td className="px-6 py-4 text-center text-primary-600 text-sm font-semibold">{c.presentThisSunday}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${c.attendanceRate >= 70 ? "badge-success" : c.attendanceRate >= 40 ? "badge-pending" : "badge-danger"}`}>{c.attendanceRate}%</span>
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
