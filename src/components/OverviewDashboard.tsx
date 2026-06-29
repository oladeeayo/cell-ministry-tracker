"use client";

import { useState, useEffect } from "react";
import ZoneDashboardView from "./ZoneDashboardView";

interface OverviewData {
  stats: {
    totalZones: number;
    totalCells: number;
    totalMembers: number;
    presentThisSunday: number;
    cellsWithSubmission: number;
    attendanceThisMonth: number;
    momGrowth: number;
  };
  zones: {
    id: number;
    zoneNumber: string;
    zonalLeader: string;
    totalCells: number;
    totalMembers: number;
    presentThisSunday: number;
    attendanceThisMonth: number;
  }[];
}

export default function OverviewDashboard({ userRole }: { userRole: string }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/overview")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading overview...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-400">Failed to load overview</div>;
  }

  const { stats } = data;

  if (selectedZone) {
    return (
      <div>
        <button
          onClick={() => setSelectedZone(null)}
          className="text-sm text-primary-600 hover:underline mb-4 flex items-center gap-1"
        >
          ← Back to Overview
        </button>
        <ZoneDashboardView zoneId={selectedZone} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Ministry Overview</h2>
        <p className="text-gray-500">
          {userRole === "COMMUNITY_PASTOR" ? "Community Pastor" : "District Leader"} Dashboard
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Zones" value={stats.totalZones} icon="🗺️" />
        <StatCard label="Total Cells" value={stats.totalCells} icon="🏠" />
        <StatCard label="Total Members" value={stats.totalMembers} icon="👥" />
        <StatCard
          label="Present This Sunday"
          value={stats.presentThisSunday}
          icon="✅"
        />
        <StatCard
          label="Cells Submitted This Week"
          value={`${stats.cellsWithSubmission}/${stats.totalCells}`}
          icon="📋"
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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Zones Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-6 py-3 font-medium text-gray-600">Zone</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Zonal Leader</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Cells</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Members</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Present</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">Monthly</th>
              </tr>
            </thead>
            <tbody>
              {data.zones.map((zone) => (
                <tr
                  key={zone.id}
                  onClick={() => setSelectedZone(zone.id)}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                >
                  <td className="px-6 py-3 font-medium text-primary-700">
                    Zone {zone.zoneNumber}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{zone.zonalLeader}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{zone.totalCells}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{zone.totalMembers}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{zone.presentThisSunday}</td>
                  <td className="px-4 py-3 text-center text-gray-800">{zone.attendanceThisMonth}</td>
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
