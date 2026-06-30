"use client";

import { useState, useEffect } from "react";
import AttendanceSheet from "./AttendanceSheet";
import MemberManagement from "./MemberManagement";
import BulkImportModal from "./BulkImportModal";
import DateRangePicker from "./DateRangePicker";
import AttendancePieChart from "./AttendancePieChart";
import AttendanceCalendar from "./AttendanceCalendar";
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
  const [sundays, setSundays] = useState<string[]>([]);
  const [members, setMembers] = useState<any[]>([]);
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
      setSundays(data.sundays || []);
      setMembers(data.members || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStats(); }, [cellId, dateRange.from, dateRange.to]);

  const currentCell = cells.find((c) => c.id === cellId);
  const isCellLeader = ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"].includes(userRole);
  const atRiskMembers = members.filter((m: any) => (m.consecutiveAbsences || 0) >= 3);
  const visitors = members.filter((m: any) => m.isVisitor);

  const calendarData = sundays.map((s) => {
    const present = members.filter((m: any) => m.attendance?.[s]?.present).length;
    return { date: s, present, total: members.length };
  });

  if (cells.length === 0) return <div className="card-compact text-center py-12"><p className="text-slate-400">No cells assigned to you.</p></div>;

  const printReport = () => window.print();

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 print:hidden">
        <div className="min-w-0">
          {stats?.cell && (
            <p className="text-xs sm:text-sm text-primary-600 font-semibold mb-0.5">Zone {stats.cell.zone?.zoneNumber} &rsaquo; {stats.cell.name}</p>
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 truncate">{currentCell?.name || "Cell Dashboard"}</h2>
          {stats?.cell?.cellLeader && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Cell Leader: <span className="font-medium text-slate-700">{stats.cell.cellLeader.name}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap">
          <select
            value={cellId}
            onChange={(e) => setCellId(parseInt(e.target.value))}
            className="form-select !min-w-0 !w-auto !max-w-[110px] sm:!max-w-none sm:!w-auto text-[10px] sm:text-sm"
          >
            {cells.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <DateRangePicker from={dateRange.from} to={dateRange.to} onChange={(f, t) => setDateRange({ from: f, to: t })} />
          <button onClick={printReport} className="btn-secondary !py-1.5 sm:!py-2 !px-2.5 sm:!px-4 !text-[10px] sm:!text-xs" title="Print Report">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
            Print
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { label: "Members", value: members.length || 0, color: "amber" },
            { label: "Avg Rate", value: `${stats.attendanceRate || 0}%`, color: "blue", highlight: "text-emerald-600" },
            { label: "Visitors", value: visitors.length, sub: `${visitors.filter((v: any) => v.firstVisitDate).length} first-timers`, color: "purple" },
            { label: "At Risk", value: atRiskMembers.length, sub: "3+ consecutive absences", color: "red" },
          ].map((kpi, i) => (
            <div key={i} className="card-compact text-center">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  kpi.color === "amber" ? "bg-amber-50" : kpi.color === "blue" ? "bg-blue-50" : kpi.color === "purple" ? "bg-purple-50" : "bg-red-50"
                }`}>
                  {kpi.color === "amber" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                  {kpi.color === "blue" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0ea5e9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                  {kpi.color === "purple" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                  {kpi.color === "red" && <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                </div>
                <p className="text-xs text-slate-500 font-medium">{kpi.label}</p>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold truncate ${kpi.highlight || (kpi.color === "red" && atRiskMembers.length > 0 ? "text-red-500" : "text-slate-900")}`}>{kpi.value}</p>
              {kpi.sub && <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      {weeklyTrend.length > 0 && (
        <div className="card">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Attendance Trend</h3>
          <p className="text-xs text-slate-400 mb-6">Weekly attendance for this cell</p>
          <ResponsiveContainer width="100%" height={220}>
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

      {/* Pie + Calendar + At-Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {members.length > 0 && (
          <AttendancePieChart
            present={members.filter((m: any) => m.attendance?.[sundays[sundays.length - 1]]?.present).length}
            absent={members.filter((m: any) => !m.attendance?.[sundays[sundays.length - 1]]?.present).length}
          />
        )}
        {calendarData.length > 0 && <div className="lg:col-span-1"><AttendanceCalendar data={calendarData} /></div>}
        {atRiskMembers.length > 0 && (
          <div className="card-compact !p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                At-Risk ({atRiskMembers.length})
              </h4>
              <div className="group relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 text-white text-xs rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">Members with 3 or more consecutive unexcused absences. These members may be disengaging and need pastoral follow-up.</div>
              </div>
            </div>
            <div className="space-y-1.5">
              {atRiskMembers.slice(0, 8).map((m: any) => (
                <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-red-50 last:border-0">
                  <span className="text-xs text-slate-700 truncate max-w-[120px]">{m.name}</span>
                  <span className="text-xs font-semibold text-red-500 shrink-0 ml-2">{m.consecutiveAbsences} absences</span>
                </div>
              ))}
              {atRiskMembers.length > 8 && <p className="text-xs text-slate-400 text-center pt-2">+{atRiskMembers.length - 8} more</p>}
            </div>
          </div>
        )}
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto print:hidden">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "attendance" ? "text-primary-600 border-primary-600" : "text-slate-400 border-transparent hover:text-slate-600"
          }`}
        >Attendance</button>
        <button
          onClick={() => setActiveTab("members")}
          className={`px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold transition border-b-2 -mb-px whitespace-nowrap ${
            activeTab === "members" ? "text-primary-600 border-primary-600" : "text-slate-400 border-transparent hover:text-slate-600"
          }`}
        >Members</button>
      </div>

      {activeTab === "attendance" && (
        <>
          <div className="flex flex-wrap gap-2 sm:gap-3 print:hidden">
            <button onClick={() => setShowAddModal(true)} className="btn-primary !px-3 sm:!px-5 !py-2 sm:!py-2.5 !text-xs sm:!text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
              Add Member
            </button>
            <button onClick={() => setShowBulkImport(true)} className="btn-secondary !px-3 sm:!px-5 !py-2 sm:!py-2.5 !text-xs sm:!text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sm:w-4 sm:h-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
              Bulk Import
            </button>
          </div>
          <AttendanceSheet cellId={cellId} userRole={userRole} onAddMember={() => setShowAddModal(true)} />
        </>
      )}

      {activeTab === "members" && (
        <MemberManagement cellId={cellId} userRole={userRole} refreshTrigger={refreshTrigger} />
      )}

      {/* Modals */}
      {showBulkImport && (
        <BulkImportModal cellId={cellId} onClose={() => setShowBulkImport(false)} onDone={() => { setShowBulkImport(false); setRefreshTrigger((r) => r + 1); }} />
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8" onClick={(e) => e.stopPropagation()}>
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
  const [isVisitor, setIsVisitor] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, address, role: "MEMBER", cellId: String(cellId), isVisitor }),
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
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={isVisitor} onChange={(e) => setIsVisitor(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
        <span className="text-sm text-slate-700">Mark as visitor</span>
      </label>
      <p className="text-xs text-slate-400">Members don't need login accounts.</p>
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={submitting || !name.trim()} className="btn-primary flex-1">
          {submitting ? "Adding..." : "Add Member"}
        </button>
      </div>
    </form>
  );
}
