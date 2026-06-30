"use client";

import { useState, useEffect, useMemo } from "react";

interface Member {
  id: number;
  name: string;
  phone: string;
  role: string;
  attendance: Record<string, boolean>;
}

interface AttendanceSheetProps {
  cellId: number;
  onAddMember?: () => void;
}

function getActiveSunday(): string {
  const now = new Date();
  const d = new Date(now);
  const day = d.getDay();
  const diff = day === 0 ? 0 : day;
  d.setDate(d.getDate() - diff);
  d.setHours(12, 0, 0, 0);

  const nextWeek = new Date(d);
  nextWeek.setDate(d.getDate() + 7);
  if (nextWeek.getMonth() !== d.getMonth()) {
    d.setDate(d.getDate() - 7);
  }

  return d.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
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

export default function AttendanceSheet({ cellId, onAddMember }: AttendanceSheetProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [sundays, setSundays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const activeSunday = useMemo(() => getActiveSunday(), []);
  const isActiveSundayEditable = sundays.length > 0 && sundays[sundays.length - 1] === activeSunday;

  const pastSundays = useMemo(
    () => sundays.filter((s) => s !== activeSunday),
    [sundays, activeSunday]
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/cell/${cellId}`);
      const data = await res.json();
      setMembers(data.members || []);
      setSundays(data.sundays || []);
    } catch (e) {
      console.error("Failed to load attendance sheet", e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (cellId) fetchData();
  }, [cellId]);

  const toggleAttendance = (memberId: number, date: string, currentValue: boolean) => {
    if (!isActiveSundayEditable) return;
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, attendance: { ...m.attendance, [date]: !currentValue } }
          : m
      )
    );
  };

  const saveAttendance = async () => {
    if (!isActiveSundayEditable) return;
    setSaving(true);
    setSaved(false);

    const attendance = members.map((m) => ({
      cellMemberId: m.id,
      isPresent: m.attendance[activeSunday] || false,
    }));

    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cellId, date: activeSunday, attendance }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save attendance", e);
    }
    setSaving(false);
  };

  const downloadAttendanceCSV = () => {
    const rows = [["Member", "Role", "Phone", ...sundays.map(formatDateShort)]];
    members.forEach((m) => {
      rows.push([
        m.name,
        m.role,
        m.phone,
        ...sundays.map((s) => (m.attendance[s] ? "Present" : "Absent")),
      ]);
    });
    downloadCSV(`attendance-cell-${cellId}.csv`, rows);
  };

  const downloadSummaryCSV = () => {
    const rows = [["Sunday", "Total Members", "Present", "Absent", "Attendance %"]];
    sundays.forEach((s) => {
      const present = members.filter((m) => m.attendance[s]).length;
      const total = members.length;
      rows.push([
        formatDateShort(s),
        String(total),
        String(present),
        String(total - present),
        `${total > 0 ? Math.round((present / total) * 100) : 0}%`,
      ]);
    });
    downloadCSV(`attendance-summary-cell-${cellId}.csv`, rows);
  };

  const countPresent = (date: string) => members.filter((m) => m.attendance[date]).length;

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading attendance sheet...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 mb-4">No members in this cell.</p>
        {onAddMember && (
          <button
            onClick={onAddMember}
            className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 transition"
          >
            + Add First Member
          </button>
        )}
      </div>
    );
  }

  if (sundays.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No service Sundays this month (excluding last Sunday).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {saved && (
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm">
          Attendance saved successfully!
        </div>
      )}

      {/* Active Sunday */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800">
              Attendance — {formatDate(activeSunday)}
            </h3>
            {!isActiveSundayEditable && (
              <p className="text-xs text-amber-600 mt-0.5">
                This Sunday&apos;s attendance window has closed. Data is read-only.
              </p>
            )}
            {isActiveSundayEditable && (
              <p className="text-xs text-gray-400 mt-0.5">
                Mark who was present and click Save.
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {isActiveSundayEditable && (
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition"
              >
                {saving ? "Saving..." : "Save Attendance"}
              </button>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Member</th>
                <th className="text-left px-3 py-3 font-medium text-gray-500">Role</th>
                <th className="text-center px-3 py-3 font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const isPresent = member.attendance[activeSunday];
                return (
                  <tr key={member.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-800">{member.name}</td>
                    <td className="px-3 py-3 text-xs text-gray-500">
                      <span className="bg-gray-100 px-2 py-0.5 rounded">
                        {member.role === "MEMBER"
                          ? "Member"
                          : member.role === "ASST_CELL_LEADER"
                          ? "Asst. Leader"
                          : member.role === "E_GROUP_LEADER"
                          ? "E-Group"
                          : member.role}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isActiveSundayEditable ? (
                        <label className="inline-flex items-center justify-center w-8 h-8 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isPresent || false}
                            onChange={() =>
                              toggleAttendance(member.id, activeSunday, isPresent || false)
                            }
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                          />
                        </label>
                      ) : (
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                            isPresent
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {isPresent ? "Present" : "Absent"}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        {onAddMember && (
          <button
            onClick={onAddMember}
            className="px-4 py-2 border border-primary-300 text-primary-700 rounded-lg text-sm font-medium hover:bg-primary-50 transition"
          >
            + Add Member
          </button>
        )}
        <button
          onClick={downloadAttendanceCSV}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          Download Full CSV
        </button>
        <button
          onClick={downloadSummaryCSV}
          className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition"
        >
          Download Summary CSV
        </button>
      </div>

      {/* Past Sundays */}
      {pastSundays.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Past Records (Read Only)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Sunday</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Present</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Absent</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-center px-3 py-3 font-medium text-gray-500">%</th>
                </tr>
              </thead>
              <tbody>
                {pastSundays.map((s) => {
                  const present = countPresent(s);
                  const total = members.length;
                  return (
                    <tr key={s} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-600">
                        {formatDateShort(s)}
                      </td>
                      <td className="px-3 py-3 text-center text-green-600 font-medium">
                        {present}
                      </td>
                      <td className="px-3 py-3 text-center text-red-500">{total - present}</td>
                      <td className="px-3 py-3 text-center text-gray-700">{total}</td>
                      <td className="px-3 py-3 text-center text-gray-700">
                        {total > 0 ? Math.round((present / total) * 100) : 0}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
