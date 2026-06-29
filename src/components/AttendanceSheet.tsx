"use client";

import { useState, useEffect } from "react";

interface Member {
  id: number;
  name: string;
  phone: string;
  role: string;
  attendance: Record<string, boolean>;
}

interface AttendanceSheetProps {
  cellId: number;
}

export default function AttendanceSheet({ cellId }: AttendanceSheetProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [sundays, setSundays] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  const toggleAttendance = async (memberId: number, date: string, currentValue: boolean) => {
    // Optimistic update
    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, attendance: { ...m.attendance, [date]: !currentValue } }
          : m
      )
    );
  };

  const saveAttendance = async () => {
    if (sundays.length === 0) return;
    setSaving(true);
    setSaved(false);

    // Save last Sunday's data
    const lastSunday = sundays[sundays.length - 1];
    const attendance = members.map((m) => ({
      cellMemberId: m.id,
      isPresent: m.attendance[lastSunday] || false,
    }));

    try {
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cellId,
          date: lastSunday,
          attendance,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save attendance", e);
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-400">Loading attendance sheet...</div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        No members in this cell. Add members first.
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T12:00:00");
    return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  };

  const countPresent = (date: string) =>
    members.filter((m) => m.attendance[date]).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Attendance Sheet</h3>
        <button
          onClick={saveAttendance}
          disabled={saving}
          className="px-4 py-2 bg-primary-700 text-white rounded-lg text-sm font-medium hover:bg-primary-800 disabled:opacity-50 transition"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
          Attendance saved successfully!
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600 min-w-[200px] sticky left-0 bg-gray-50">
                Member
              </th>
              <th className="text-left px-3 py-3 font-medium text-gray-500">Role</th>
              {sundays.map((date) => (
                <th key={date} className="text-center px-2 py-3 font-medium text-gray-600 min-w-[80px]">
                  <div>{formatDate(date)}</div>
                  <div className="text-xs text-gray-400 mt-0.5 font-normal">
                    {countPresent(date)}/{members.length}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                <td className="px-4 py-3 font-medium text-gray-800 sticky left-0 bg-white">
                  {member.name}
                </td>
                <td className="px-3 py-3 text-gray-500 text-xs">
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
                {sundays.map((date) => (
                  <td key={date} className="text-center px-2 py-3">
                    <label className="inline-flex items-center justify-center w-8 h-8 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={member.attendance[date] || false}
                        onChange={() =>
                          toggleAttendance(member.id, date, member.attendance[date] || false)
                        }
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                      />
                    </label>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        * Sundays exclude the last Sunday of each month. Check members present and click Save.
      </p>
    </div>
  );
}
