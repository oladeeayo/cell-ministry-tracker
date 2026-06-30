"use client";

import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
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
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({ name: "", phone: "", address: "", role: "MEMBER" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  const fetchData = () => {
    fetch(`/api/dashboard/cell/${cellId}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [cellId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.name || !memberForm.phone) {
      setAddError("Name and phone are required");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...memberForm, cellId: String(cellId) }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAddError(err.error || "Failed to add member");
        setAdding(false);
        return;
      }
      setShowAddMember(false);
      setMemberForm({ name: "", phone: "", address: "", role: "MEMBER" });
      fetchData();
    } catch {
      setAddError("Network error");
    }
    setAdding(false);
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-400">Loading cell dashboard...</div>;
  }

  if (!data) {
    return <div className="text-center py-12 text-red-400">Failed to load cell data</div>;
  }

  const { stats } = data;

  const trendData = data.sundays.map((s) => {
    const d = new Date(s + "T12:00:00");
    const present = data.members.filter((m: any) => m.attendance[s]).length;
    return {
      date: d.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
      present,
      absent: data.members.length - present,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{data.cell?.name}</h2>
        <p className="text-gray-500">Zone {data.cell?.zone?.zoneNumber}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Members" value={stats.totalMembers} icon="👥" />
        <StatCard
          label="Present This Sunday"
          value={stats.presentThisSunday}
          subtitle={stats.lastSundayDate ? new Date(stats.lastSundayDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
          icon="✅"
        />
        <StatCard label="Attendance This Month" value={stats.attendanceThisMonth} icon="📅" />
        <StatCard label="MoM Growth" value={`${stats.momGrowth >= 0 ? "+" : ""}${stats.momGrowth}%`} icon="📈" positive={stats.momGrowth >= 0} />
      </div>

      {/* Mini trend chart */}
      {trendData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
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

      {/* Attendance Sheet */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AttendanceSheet cellId={cellId} onAddMember={() => setShowAddMember(true)} />
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add New Member</h3>
              <button onClick={() => setShowAddMember(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            {addError && <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">{addError}</div>}
            <form onSubmit={handleAddMember} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" value={memberForm.name} onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input required className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" value={memberForm.address} onChange={(e) => setMemberForm({ ...memberForm, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}>
                  <option value="MEMBER">Member</option>
                  <option value="ASST_CELL_LEADER">Asst. Cell Leader</option>
                  <option value="E_GROUP_LEADER">E-Group Leader</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Cancel</button>
                <button type="submit" disabled={adding} className="flex-1 py-2.5 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition">{adding ? "Adding..." : "Add Member"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, subtitle, icon, positive }: { label: string; value: string | number; subtitle?: string; icon: string; positive?: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2"><span className="text-2xl">{icon}</span></div>
      <div className={`text-2xl font-bold ${positive !== undefined ? (positive ? "text-green-600" : "text-red-600") : "text-gray-800"}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
    </div>
  );
}
