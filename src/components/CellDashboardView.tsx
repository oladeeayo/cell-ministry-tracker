"use client";

import { useState, useEffect } from "react";
import AttendanceSheet from "./AttendanceSheet";
import MemberManagement from "./MemberManagement";
import BulkImportModal from "./BulkImportModal";
import DateRangePicker from "./DateRangePicker";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  userRole: string;
  cells: { id: number; name: string; zoneId: number }[];
  defaultCellId?: number;
}

function formatDate(d: string) { return new Date(d + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" }); }
function getMonthRange() {
  const n = new Date();
  return { from: new Date(n.getFullYear(), n.getMonth(), 1).toISOString().split("T")[0], to: n.toISOString().split("T")[0] };
}

export default function CellDashboardView({ userRole, cells, defaultCellId }: Props) {
  const [cellId, setCellId] = useState(defaultCellId || (cells.length > 0 ? cells[0].id : 0));
  const [stats, setStats] = useState<any>(null);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [dateRange, setDateRange] = useState(getMonthRange());

  const fetchStats = async () => {
    if (!cellId) return;
    try {
      const res = await fetch(`/api/dashboard/cell/${cellId}?from=${dateRange.from}&to=${dateRange.to}`);
      const data = await res.json();
      setStats(data);
      setWeeklyTrend(data.weeklyTrend || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStats(); }, [cellId, dateRange.from, dateRange.to]);

  if (cells.length === 0) return <div className="text-center py-12 text-gray-400">No cells assigned to you.</div>;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <select value={cellId} onChange={(e) => setCellId(parseInt(e.target.value))} className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary-500 outline-none">
            {cells.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBulkImport(true)} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Bulk Import</button>
          <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 transition">+ Add Member</button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Members</p><p className="text-2xl font-bold text-gray-800 mt-0.5">{stats.memberCount || 0}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Present (Last Sun)</p><p className="text-2xl font-bold text-primary-700 mt-0.5">{stats.presentThisSunday || 0}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Attendance (Range)</p><p className="text-2xl font-bold text-indigo-600 mt-0.5">{stats.attendanceInRange || 0}</p></div>
          <div className="bg-white p-4 rounded-xl border border-gray-200"><p className="text-xs text-gray-400">Avg Rate</p><p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.attendanceRate || 0}%</p></div>
        </div>
      )}

      {/* Chart */}
      {weeklyTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Weekly Attendance Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weeklyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tickFormatter={formatDate} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip labelFormatter={(v) => formatDate(v)} />
              <Bar dataKey="present" fill="var(--color-primary-600, #4f46e5)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Attendance Sheet */}
      <AttendanceSheet cellId={cellId} userRole={userRole} onAddMember={() => setShowAddModal(true)} />

      {/* Member Management */}
      <MemberManagement cellId={cellId} userRole={userRole} refreshTrigger={refreshTrigger} />

      {/* Bulk Import Modal */}
      {showBulkImport && <BulkImportModal cellId={cellId} onClose={() => setShowBulkImport(false)} onDone={() => { setShowBulkImport(false); setRefreshTrigger((r) => r + 1); }} />}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5"><h3 className="text-lg font-semibold text-gray-800">Add Member</h3><button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button></div>
            <AddMemberForm cellId={cellId} onDone={() => { setShowAddModal(false); setRefreshTrigger((r) => r + 1); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function AddMemberForm({ cellId, onDone }: { cellId: number; onDone: () => void }) {
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [address, setAddress] = useState(""); const [role, setRole] = useState("MEMBER"); const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!name.trim()) return; setSubmitting(true);
    try {
      await fetch("/api/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, address, role, cellId: String(cellId), skipAccount: role === "MEMBER" }) });
      onDone();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      <input placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      <input placeholder="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
      <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
        <option value="MEMBER">Member</option>
        <option value="ASST_CELL_LEADER">Asst. Cell Leader</option>
        <option value="E_GROUP_LEADER">E-Group Leader</option>
      </select>
      <p className="text-xs text-gray-400">Members don't need login accounts.</p>
      <button type="submit" disabled={submitting || !name.trim()} className="w-full py-2.5 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition">{submitting ? "Adding..." : "Add Member"}</button>
    </form>
  );
}
