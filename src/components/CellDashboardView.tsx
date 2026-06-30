"use client";

import { useState, useEffect, useMemo } from "react";
import AttendanceSheet from "./AttendanceSheet";
import MemberManagement from "./MemberManagement";
import BulkImportModal from "./BulkImportModal";
import DateRangePicker from "./DateRangePicker";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

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
  const [activeTab, setActiveTab] = useState<"attendance" | "members">("attendance");

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

  const currentCell = cells.find((c) => c.id === cellId);
  const isCellLeader = ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(userRole);

  if (cells.length === 0) return <div className="card-compact text-center py-12"><p className="text-slate-400">No cells assigned to you.</p></div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{currentCell?.name || "Cell Dashboard"}</h2>
          <p className="text-sm text-slate-400 mt-0.5">Manage attendance and members</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={cellId}
            onChange={(e) => setCellId(parseInt(e.target.value))}
            className="form-select !w-auto !min-w-[160px]"
          >
            {cells.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          <div className="card-compact">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Members</p>
            </div>
            <p className="text-3xl font-bold text-slate-900">{stats.memberCount || 0}</p>
          </div>
          <div className="card-compact">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Avg Rate</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{stats.attendanceRate || 0}%</p>
          </div>
          <div className="card-compact">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Attendance</p>
            </div>
            <p className="text-3xl font-bold text-indigo-600">{stats.attendanceInRange || 0}</p>
            <p className="text-xs text-slate-400 mt-1">in selected range</p>
          </div>
          <div className="card-compact">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <p className="text-xs text-slate-500 font-medium">Present (Last Sun)</p>
            </div>
            <p className="text-3xl font-bold text-primary-600">{stats.presentThisSunday || 0}</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {weeklyTrend.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-bold text-slate-900 mb-1">Attendance Trend</h3>
          <p className="text-xs text-slate-400 mb-6">Weekly attendance for this cell</p>
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

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
            activeTab === "attendance" ? "text-primary-600 border-primary-600" : "text-slate-400 border-transparent hover:text-slate-600"
          }`}
        >Attendance</button>
        <button
          onClick={() => setActiveTab("members")}
          className={`px-5 py-3 text-sm font-semibold transition border-b-2 -mb-px ${
            activeTab === "members" ? "text-primary-600 border-primary-600" : "text-slate-400 border-transparent hover:text-slate-600"
          }`}
        >Members</button>
      </div>

      {/* Attendance Tab */}
      {activeTab === "attendance" && (
        <>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => setShowAddModal(true)} className="btn-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
              Add Member
            </button>
            <button onClick={() => setShowBulkImport(true)} className="btn-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Bulk Import
            </button>
          </div>
          <AttendanceSheet cellId={cellId} userRole={userRole} onAddMember={() => setShowAddModal(true)} />
        </>
      )}

      {/* Members Tab */}
      {activeTab === "members" && (
        <MemberManagement cellId={cellId} userRole={userRole} refreshTrigger={refreshTrigger} />
      )}

      {/* Modals */}
      {showBulkImport && (
        <BulkImportModal cellId={cellId} onClose={() => setShowBulkImport(false)} onDone={() => { setShowBulkImport(false); setRefreshTrigger((r) => r + 1); }} />
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900">Add Member</h3>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
              </button>
            </div>
            <AddMemberForm cellId={cellId} onDone={() => { setShowAddModal(false); setRefreshTrigger((r) => r + 1); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function AddMemberForm({ cellId, onDone }: { cellId: number; onDone: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, role, cellId: String(cellId), skipAccount: role === "MEMBER" }),
      });
      onDone();
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
        <input required placeholder="Enter full name" value={name} onChange={(e) => setName(e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number</label>
        <input placeholder="+234 XXX XXX XXXX" value={phone} onChange={(e) => setPhone(e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address</label>
        <input placeholder="Optional" value={address} onChange={(e) => setAddress(e.target.value)} className="form-input" />
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="form-select">
          <option value="MEMBER">Member</option>
          <option value="ASST_CELL_LEADER">Asst. Cell Leader</option>
          <option value="E_GROUP_LEADER">E-Group Leader</option>
        </select>
      </div>
      <p className="text-xs text-slate-400">Members don't need login accounts.</p>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting || !name.trim()} className="btn-primary flex-1">
          {submitting ? "Adding..." : "Add Member"}
        </button>
      </div>
    </form>
  );
}
