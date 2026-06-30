"use client";

import { useState, useEffect } from "react";
import DateRangePicker from "./DateRangePicker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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

  if (loading) return <div className="text-center py-8 text-gray-400">Loading overview...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">Overall Dashboard</h2>
        <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Zones</p><p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalZones}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Cells</p><p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalCells}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Members</p><p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.totalMembers}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">MoM Growth</p><p className={`text-2xl font-bold mt-0.5 ${(stats.momGrowth || 0) >= 0 ? "text-green-600" : "text-red-500"}`}>{stats.momGrowth}%</p></div>
        </div>
      )}

      {/* Weekly Trend */}
      {weeklyTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Overall Weekly Attendance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyTrend.map((w) => ({ name: formatDate(w.date), present: w.present }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="present" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Zone Comparison */}
      {zones.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Zone Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zones.map((z) => ({ name: `Zone ${z.zoneNumber}`, present: z.presentThisSunday, rate: z.attendanceRate }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="present" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Zone Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-semibold text-gray-800">All Zones</h3>
          <input type="text" placeholder="Search zone/leader..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-48 focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50"><th className="text-left px-4 py-3 font-medium text-gray-600">Zone</th><th className="text-left px-3 py-3 font-medium text-gray-500">Zonal Leader</th><th className="text-center px-3 py-3 font-medium text-gray-500">Cells</th><th className="text-center px-3 py-3 font-medium text-gray-500">Members</th><th className="text-center px-3 py-3 font-medium text-gray-500">Present (Last Sun)</th><th className="text-center px-3 py-3 font-medium text-gray-500">Attendance (Range)</th><th className="text-center px-3 py-3 font-medium text-gray-500">Rate</th></tr></thead>
            <tbody>
              {filteredZones.map((z: any) => (
                <tr key={z.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800"><a href={`/dashboard?zone=${z.id}`} className="text-primary-700 hover:underline">Zone {z.zoneNumber}</a></td>
                  <td className="px-3 py-3 text-gray-600">{z.zonalLeader}</td>
                  <td className="px-3 py-3 text-center font-medium text-gray-700">{z.totalCells}</td>
                  <td className="px-3 py-3 text-center font-medium text-gray-700">{z.totalMembers}</td>
                  <td className="px-3 py-3 text-center text-primary-700 font-medium">{z.presentThisSunday}</td>
                  <td className="px-3 py-3 text-center text-indigo-600 font-medium">{z.attendanceInRange}</td>
                  <td className="px-3 py-3 text-center"><span className={`px-2 py-0.5 rounded text-xs font-medium ${z.attendanceRate >= 70 ? "bg-green-100 text-green-700" : z.attendanceRate >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>{z.attendanceRate}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
