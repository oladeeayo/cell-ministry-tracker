"use client";

import { useState, useEffect, useMemo } from "react";

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

  const downloadAttendanceCSV = () => {
    const rows = [["Member", "Role", "Phone", ...sundays.map(formatDateShort), "Attendance Rate"]];
    members.forEach((m) => rows.push([m.name, m.role, m.phone, ...sundays.map((s) => m.attendance[s]?.present ? "Present" : "Absent"), `${m.attendanceRate || 0}%`]));
    downloadCSV(rows, `attendance-cell-${cellId}.csv`);
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading attendance sheet...</div>;

  if (members.length === 0) {
    return <div className="text-center py-12"><p className="text-gray-400 mb-4">No members in this cell.</p>{onAddMember && <button onClick={onAddMember} className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 transition">+ Add First Member</button>}</div>;
  }

  return (
    <div className="space-y-6">
      {saved && <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">Attendance saved successfully!</div>}

      {/* Active Sunday */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-semibold text-gray-800">Attendance — {formatDate(activeSunday)}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{isEditable ? "Mark who was present and click Save." : "View-only. Previous records are locked."}</p>
          </div>
          {isEditable && <button onClick={saveAttendance} disabled={saving} className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition">{saving ? "Saving..." : "Save"}</button>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Member</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Role</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Status</th>
                {isEditable && <th className="text-left px-3 py-3 font-medium text-gray-500">Note</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const a = m.attendance[activeSunday];
                const isPresent = a?.present || false;
                return (
                  <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-3 py-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">{m.role === "MEMBER" ? "Member" : m.role === "ASST_CELL_LEADER" ? "Asst." : m.role === "E_GROUP_LEADER" ? "E-Group" : m.role}</span></td>
                    <td className="px-3 py-3 text-center">
                      {isEditable ? (
                        <label className="inline-flex items-center justify-center w-8 h-8 cursor-pointer"><input type="checkbox" checked={isPresent} onChange={() => toggleAttendance(m.id, isPresent)} className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer" /></label>
                      ) : (
                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${isPresent ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{isPresent ? "Present" : "Absent"}</span>
                      )}
                    </td>
                    {isEditable && (
                      <td className="px-3 py-3">
                        <input placeholder="Optional note..." value={notes[`${m.id}-${activeSunday}`] ?? a?.note ?? ""} onChange={(e) => setNotes({ ...notes, [`${m.id}-${activeSunday}`]: e.target.value })} className="w-full px-2 py-1 border border-gray-200 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none" />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {onAddMember && <button onClick={onAddMember} className="px-4 py-2 border border-primary-300 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-50 transition">+ Add Member</button>}
        <button onClick={downloadAttendanceCSV} className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">Download CSV</button>
      </div>

      {/* Past Sundays */}
      {pastSundays.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Past Records (Read Only)</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50"><th className="text-left px-4 py-3 font-medium text-gray-600">Sunday</th><th className="text-center px-3 py-3 font-medium text-gray-500">Present</th><th className="text-center px-3 py-3 font-medium text-gray-500">Absent</th><th className="text-center px-3 py-3 font-medium text-gray-500">Total</th><th className="text-center px-3 py-3 font-medium text-gray-500">%</th></tr></thead>
              <tbody>
                {pastSundays.map((s) => {
                  const present = countPresent(s); const total = members.length;
                  return <tr key={s} className="border-t border-gray-100"><td className="px-4 py-3 font-medium text-gray-600">{formatDateShort(s)}</td><td className="px-3 py-3 text-center text-green-600 font-medium">{present}</td><td className="px-3 py-3 text-center text-red-500">{total - present}</td><td className="px-3 py-3 text-center text-gray-700">{total}</td><td className="px-3 py-3 text-center text-gray-700">{total > 0 ? Math.round((present / total) * 100) : 0}%</td></tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
