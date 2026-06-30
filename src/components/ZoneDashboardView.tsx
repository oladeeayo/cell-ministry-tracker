"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import CellDashboardView from "./CellDashboardView";

interface ZoneData {
  zone: any;
  stats: {
    totalCells: number;
    cellsWithSubmission: number;
    totalMembers: number;
    presentThisSunday: number;
    attendanceThisMonth: number;
    momGrowth: number;
    lastSundayDate: string;
  };
  cellStats: {
    id: number;
    name: string;
    leaderName: string;
    totalMembers: number;
    presentThisSunday: number;
    attendanceThisMonth: number;
  }[];
  weeklyTrend: { date: string; present: number }[];
}

function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function downloadCSV(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function ZoneDashboardView({ zoneId, userRole }: { zoneId: number; userRole?: string }) {
  const [data, setData] = useState<ZoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/zone/${zoneId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [zoneId]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading zone dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-400">Failed to load zone data</div>;
  }

  const { stats } = data;

  if (selectedCell) {
    return (
      <div>
        <button onClick={() => setSelectedCell(null)} className="text-sm text-primary-600 hover:underline mb-4 flex items-center gap-1">← Back to Zone Overview</button>
        <CellDashboardView cellId={selectedCell} userRole={userRole || ""} />
      </div>
    );
  }

  const chartData = data.cellStats.map((c) => ({
    name: c.name,
    Members: c.totalMembers,
    Present: c.presentThisSunday,
  }));

  const trendData = data.weeklyTrend.map((w) => ({
    date: formatDateShort(w.date),
    present: w.present,
  }));

  const handleDownloadCSV = () => {
    const rows = [
      ["Cell Name", "Leader", "Total Members", "Present This Sunday", "Attendance This Month"],
      ...data.cellStats.map((c) => [c.name, c.leaderName, String(c.totalMembers), String(c.presentThisSunday), String(c.attendanceThisMonth)]),
    ];
    downloadCSV(`zone-${data.zone?.zoneNumber}-report.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Zone {data.zone?.zoneNumber}</h2>
          <p className="text-gray-500">Zonal Leader: {data.zone?.zonalLeader?.name}</p>
        </div>
        <button onClick={handleDownloadCSV} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Download CSV</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Cells" value={stats.totalCells} icon="🏠" />
        <StatCard label="Submission This Week" value={`${stats.cellsWithSubmission}/${stats.totalCells}`} icon="📋" />
        <StatCard label="Total Members" value={stats.totalMembers} icon="👥" />
        <StatCard label="Present This Sunday" value={stats.presentThisSunday} icon="✅" />
        <StatCard label="Attendance This Month" value={stats.attendanceThisMonth} icon="📅" />
        <StatCard label="MoM Growth" value={`${stats.momGrowth >= 0 ? "+" : ""}${stats.momGrowth}%`} icon="📈" positive={stats.momGrowth >= 0} />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {trendData.length > 1 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Attendance Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb" }} name="Present" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Cells Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Members" fill="#93c5fd" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Present" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Cells table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Cells in this Zone</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-600">Cell Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Leader</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Members</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Present</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {data.cellStats.map((cell) => (
                <tr key={cell.id} onClick={() => setSelectedCell(cell.id)} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition">
                  <td className="px-6 py-3 font-medium text-primary-700">{cell.name}</td>
                  <td className="px-4 py-3 text-gray-600">{cell.leaderName}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{cell.totalMembers}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{cell.presentThisSunday}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{cell.attendanceThisMonth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, positive }: { label: string; value: string | number; icon: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2"><span className="text-2xl">{icon}</span></div>
      <div className={`text-2xl font-bold ${positive !== undefined ? (positive ? "text-green-600" : "text-red-600") : "text-gray-800"}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
