"use client";

import { useState, useEffect } from "react";
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
}

export default function ZoneDashboardView({ zoneId }: { zoneId: number }) {
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
        <button
          onClick={() => setSelectedCell(null)}
          className="text-sm text-primary-600 hover:underline mb-4 flex items-center gap-1"
        >
          ← Back to Zone Overview
        </button>
        <CellDashboardView cellId={selectedCell} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">
          Zone {data.zone?.zoneNumber}
        </h2>
        <p className="text-gray-500">
          Zonal Leader: {data.zone?.zonalLeader?.name}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Cells" value={stats.totalCells} icon="🏠" />
        <StatCard
          label="Submission This Week"
          value={`${stats.cellsWithSubmission}/${stats.totalCells}`}
          icon="📋"
        />
        <StatCard label="Total Members" value={stats.totalMembers} icon="👥" />
        <StatCard
          label="Present This Sunday"
          value={stats.presentThisSunday}
          icon="✅"
        />
        <StatCard
          label="Attendance This Month"
          value={stats.attendanceThisMonth}
          icon="📅"
        />
        <StatCard
          label="MoM Growth"
          value={`${stats.momGrowth >= 0 ? "+" : ""}${stats.momGrowth}%`}
          icon="📈"
          positive={stats.momGrowth >= 0}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Cells in this Zone</h3>
        </div>
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
                <tr
                  key={cell.id}
                  onClick={() => setSelectedCell(cell.id)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                >
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

function StatCard({
  label,
  value,
  icon,
  positive,
}: {
  label: string;
  value: string | number;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${positive !== undefined ? (positive ? "text-green-600" : "text-red-600") : "text-gray-800"}`}>
        {value}
      </div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
