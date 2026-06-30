"use client";

import { useState, useEffect } from "react";
import DateRangePicker from "./DateRangePicker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

  if (loading) return <div className="text-center py-8 text-gray-400">Loading zone dashboard...</div>;
  if (!zone) return <div className="text-center py-12 text-gray-400">Zone not found.</div>;

  const chartData = weeklyTrend.map((w) => ({ name: formatDate(w.date), present: w.present }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Zone {zone.zoneNumber} — {zone.name}</h2>
          <p className="text-sm text-gray-400 mt-0.5">Zonal Leader: {zone.zonalLeader?.name || "N/A"}</p>
        </div>
        <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Cells</p><p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalCells}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Members</p><p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalMembers}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Present (Last Sun)</p><p className="text-2xl font-bold text-primary-700 mt-0.5">{stats.presentThisSunday}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">MoM Growth</p><p className={`text-2xl font-bold mt-0.5 ${(stats.momGrowth || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>{stats.momGrowth}%</p></div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="present" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Cell Stats */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-gray-800">Cells ({cellStats.length})</h3>
          <input type="text" placeholder="Search cell..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50"><th className="text-left px-4 py-3 font-medium text-gray-600">Cell</th><th className="text-left px-3 py-3 font-medium text-gray-500">Leader</th><th className="text-center px-3 py-3 font-medium text-gray-500">Members</th><th className="text-center px-3 py-3 font-medium text-gray-500">Present (Last Sun)</th><th className="text-center px-3 py-3 font-medium text-gray-500">Attendance (Range)</th><th className="text-center px-3 py-3 font-medium text-gray-500">Rate</th></tr></thead>
            <tbody>
              {filteredCells.map((c: any) => (
                <tr key={c.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800"><a href={`/dashboard?cell=${c.id}`} className="text-primary-700 hover:underline">{c.name}</a></td>
                  <td className="px-3 py-3 text-gray-600">{c.leaderName}</td>
                  <td className="px-3 py-3 text-center font-medium text-gray-700">{c.totalMembers}</td>
                  <td className="px-3 py-3 text-center text-primary-700 font-medium">{c.presentThisSunday}</td>
                  <td className="px-3 py-3 text-center text-indigo-600 font-medium">{c.attendanceInRange}</td>
                  <td className="px-3 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${c.attendanceRate >= 70 ? "bg-green-100 text-green-700" : c.attendanceRate >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{c.attendanceRate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
