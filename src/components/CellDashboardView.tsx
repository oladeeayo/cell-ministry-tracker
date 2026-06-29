"use client";

import { useState, useEffect } from "react";
import AttendanceSheet from "./AttendanceSheet";

interface CellData {
  cell: any;
  stats: {
    totalMembers: number;
    presentThisSunday: number;
    attendanceThisMonth: number;
    momGrowth: number;
    lastSundayDate: string;
  };
  sundays: string[];
  members: any[];
}

export default function CellDashboardView({ cellId }: { cellId: number }) {
  const [data, setData] = useState<CellData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/dashboard/cell/${cellId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [cellId]);

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading cell dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-400">Failed to load cell data</div>;
  }

  const { stats } = data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{data.cell?.name}</h2>
        <p className="text-gray-500">Zone {data.cell?.zone?.zoneNumber}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Members"
          value={stats.totalMembers}
          icon="👥"
        />
        <StatCard
          label="Present This Sunday"
          value={stats.presentThisSunday}
          subtitle={stats.lastSundayDate ? new Date(stats.lastSundayDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
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

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AttendanceSheet cellId={cellId} />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  subtitle,
  icon,
  positive,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
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
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}
