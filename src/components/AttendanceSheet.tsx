"use client";

import { useState, useEffect, useMemo } from "react";
import MemberAttendanceModal from "./MemberAttendanceModal";

interface Member {
  id: number; name: string; phone: string; role: string;
  attendance: Record<string, { present: boolean; note?: string }>;
  attendanceRate?: number; consecutiveAbsences?: number;
}

const ATTENDANCE_EDITORS = ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"];

interface Props { cellId: number; userRole: string; onAddMember?: () => void; }

function getActiveSunday(): string {
  const d = new Date(); const day = d.getDay(); d.setDate(d.getDate() - (day === 0 ? 0 : day)); d.setHours(12, 0, 0, 0);
  const nw = new Date(d); nw.setDate(d.getDate() + 7);
  if (nw.getMonth() !== d.getMonth()) d.setDate(d.getDate() - 7);
  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short", year: "numeric" });
}
function formatDateShort(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function downloadCSV(rows: string[][], name: string) {
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
}

export default function AttendanceSheet({ cellId, userRole, onAddMember }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [sundays, setSundays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [attendanceMember, setAttendanceMember] = useState<{ id: number; name: string } | null>(null);

  const activeSunday = useMemo(() => getActiveSunday(), []);
  const canEdit = ATTENDANCE_EDITORS.includes(userRole);
  const isEditable = canEdit && sundays.length > 0 && sundays[sundays.length - 1] === activeSunday;
  const pastSundays = sundays.filter((s) => s !== activeSunday);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/cell/${cellId}`);
      const data = await res.json();
      setMembers(data.members || []);
      setSundays(data.sundays || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (cellId) fetchData(); }, [cellId]);

  const toggleAttendance = (mid: number, val: boolean) => {
    if (!isEditable) return;
    setMembers((prev) => prev.map((m) => m.id === mid ? { ...m, attendance: { ...m.attendance, [activeSunday]: { present: !val, note: notes[`${mid}-${activeSunday}`] || m.attendance[activeSunday]?.note } } } : m));
  };

  const saveAttendance = async () => {
    if (!isEditable) return;
    setSaving(true); setSaved(false);
    const attendance = members.map((m) => ({
      cellMemberId: m.id,
      isPresent: m.attendance[activeSunday]?.present || false,
      note: notes[`${m.id}-${activeSunday}`] || m.attendance[activeSunday]?.note || null,
    }));
    try {
      await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cellId, date: activeSunday, attendance }) });
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error(e); }
    setSaving(false);
  };

  const countPresent = (d: string) => members.filter((m) => m.attendance[d]?.present).length;

  const downloadCSVAction = () => {
    const rows = [["Member", "Role", "Phone", ...sundays.map(formatDateShort), "Attendance Rate"]];
    members.forEach((m) => rows.push([m.name, m.role, m.phone, ...sundays.map((s) => m.attendance[s]?.present ? "Present" : "Absent"), `${m.attendanceRate || 0}%`]));
    downloadCSV(rows, `attendance-cell-${cellId}.csv`);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="text-slate-400">Loading attendance sheet...</div></div>;

  if (members.length === 0) {
    return (
      <div className="card-compact text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        </div>
        <p className="text-slate-500 font-medium mb-4">No members in this cell.</p>
        {onAddMember && <button onClick={onAddMember} className="btn-primary">+ Add First Member</button>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saved && (
        <div className="px-5 py-3 bg-green-50 border border-green-100 text-green-700 rounded-2xl text-sm font-medium flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          Attendance saved successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Active Sunday Table */}
        <div className="lg:col-span-3 card !p-0 overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">Attendance — {formatDate(activeSunday)}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{isEditable ? "Toggle status for each member and save." : "Previous records are locked (read-only)."}</p>
            </div>
            {isEditable && (
              <button onClick={saveAttendance} disabled={saving} className="btn-primary !text-xs sm:!text-sm !px-4 sm:!px-5 !py-2 sm:!py-2.5">
                {saving ? (
                  <span className="flex items-center gap-2"><svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>Saving...</span>
                ) : "Save Attendance"}
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-3 sm:px-6 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Member</th>
                  <th className="text-left px-2 sm:px-3 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap hidden sm:table-cell">Role</th>
                  <th className="text-center px-2 sm:px-3 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Status</th>
                  {isEditable && <th className="text-left px-2 sm:px-3 py-3 sm:py-3.5 font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">Note</th>}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const a = m.attendance[activeSunday];
                  const isPresent = a?.present || false;
                  return (
                    <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="px-3 sm:px-6 py-3 sm:py-4 min-w-0">
                        <button onClick={() => setAttendanceMember({ id: m.id, name: m.name })} className="font-semibold text-slate-900 text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none hover:text-primary-600 transition text-left">
                          {m.name}
                        </button>
                        {m.phone && <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[120px] sm:max-w-none">{m.phone}</p>}
                      </td>
                      <td className="px-2 sm:px-3 py-3 sm:py-4 hidden sm:table-cell">
                        <span className="px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold badge-neutral whitespace-nowrap">
                          {m.role === "MEMBER" ? "Member" : m.role === "ASST_CELL_LEADER" ? "Asst." : m.role === "E_GROUP_LEADER" ? "E-Group" : m.role}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-3 sm:py-4 text-center">
                        {isEditable ? (
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={isPresent} onChange={() => toggleAttendance(m.id, isPresent)} className="w-4 h-4 sm:w-5 sm:h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer" />
                            <span className={`text-[10px] sm:text-xs font-semibold ${isPresent ? "text-primary-600" : "text-slate-400"}`}>
                              {isPresent ? "Present" : "Absent"}
                            </span>
                          </label>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-semibold ${
                            isPresent ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isPresent ? "bg-green-500" : "bg-slate-400"}`} />
                            {isPresent ? "Present" : "Absent"}
                          </span>
                        )}
                      </td>
                      {isEditable && (
                        <td className="px-2 sm:px-3 py-3 sm:py-4 max-w-[80px] sm:max-w-none">
                          <input placeholder="Note..." value={notes[`${m.id}-${activeSunday}`] ?? a?.note ?? ""} onChange={(e) => setNotes({ ...notes, [`${m.id}-${activeSunday}`]: e.target.value })} className="form-input !py-1 sm:!py-1.5 !px-2 sm:!px-3 text-[10px] sm:text-xs w-full" />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Summary + History */}
        <div className="space-y-4">
          {/* Live Summary */}
          <div className="bg-slate-900 rounded-3xl p-6 text-white">
            <h4 className="text-sm font-semibold text-slate-300 mb-4">Live Summary</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Members</span>
                <span className="font-bold">{members.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Present</span>
                <span className="font-bold text-green-400">{countPresent(activeSunday)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Absent</span>
                <span className="font-bold text-red-400">{members.length - countPresent(activeSunday)}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex items-center justify-between">
                <span className="text-sm text-slate-400">Rate</span>
                <span className="font-bold text-primary-400">{members.length > 0 ? Math.round((countPresent(activeSunday) / members.length) * 100) : 0}%</span>
              </div>
            </div>
          </div>

          {/* Past History */}
          {pastSundays.length > 0 && (
            <div className="card-compact !p-4">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Recent History</h4>
              <div className="space-y-2">
                {pastSundays.slice(-4).reverse().map((s) => {
                  const present = countPresent(s); const total = members.length;
                  return (
                    <div key={s} className="flex items-center justify-between py-1.5">
                      <span className="text-xs text-slate-500">{formatDateShort(s)}</span>
                      <span className={`text-xs font-semibold ${present > 0 ? "text-green-600" : "text-slate-400"}`}>
                        {present}/{total}
                      </span>
                    </div>
                  );
                })}
              </div>
              <button onClick={downloadCSVAction} className="btn-secondary w-full mt-3 !py-2 !text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Download CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {attendanceMember && (
        <MemberAttendanceModal memberId={attendanceMember.id} memberName={attendanceMember.name} onClose={() => setAttendanceMember(null)} />
      )}
    </div>
  );
}
