"use client";

import { useState, useEffect, useMemo } from "react";
import Pagination from "./Pagination";

interface Member {
  id: number; name: string; phone: string; role: string;
  attendanceRate?: number; consecutiveAbsences?: number;
}

const EDIT_ROLES = ["CELL_LEADER", "ASST_CELL_LEADER", "E_GROUP_LEADER"];
const DELETE_ROLES = ["CELL_LEADER", "ASST_CELL_LEADER"];
const ROLE_OPTIONS = ["MEMBER", "ASST_CELL_LEADER", "E_GROUP_LEADER"];
const PAGE_SIZE = 20;

interface Props { cellId: number; userRole: string; refreshTrigger: number; }

export default function MemberManagement({ cellId, userRole, refreshTrigger }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<number | null>(null);

  const canEdit = EDIT_ROLES.includes(userRole);
  const canDelete = DELETE_ROLES.includes(userRole);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/cell/${cellId}`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { if (cellId) fetchMembers(); }, [cellId, refreshTrigger]);

  const filtered = useMemo(() => {
    if (!search) return members;
    const q = search.toLowerCase();
    return members.filter((m) => m.name.toLowerCase().includes(q) || m.phone.includes(q));
  }, [members, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [search]);

  const startEdit = (m: Member) => { setEditId(m.id); setEditName(m.name); setEditPhone(m.phone); setEditRole(m.role); };
  const cancelEdit = () => { setEditId(null); };

  const saveEdit = async () => {
    if (!editName.trim()) return;
    try {
      await fetch(`/api/members/${editId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editName, phone: editPhone, role: editRole }) });
      setEditId(null);
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this member? Their attendance records will also be removed.")) return;
    setDeleting(id);
    try {
      await fetch(`/api/members/${id}`, { method: "DELETE" });
      fetchMembers();
    } catch (e) { console.error(e); }
    setDeleting(null);
  };

  if (loading) return <div className="text-center py-8 text-gray-400">Loading members...</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold text-gray-800">Members ({members.length})</h3>
        <input type="text" placeholder="Search by name or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-60 focus:ring-2 focus:ring-primary-500 outline-none" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-3 py-3 font-medium text-gray-500">Phone</th>
              <th className="text-left px-3 py-3 font-medium text-gray-500">Role</th>
              <th className="text-center px-3 py-3 font-medium text-gray-500">Attendance</th>
              <th className="text-center px-3 py-3 font-medium text-gray-500">Absences</th>
              {(canEdit || canDelete) && <th className="text-center px-3 py-3 font-medium text-gray-500">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginated.map((m) => (
              <tr key={m.id} className="border-t border-gray-100 hover:bg-gray-50/50">
                {editId === m.id ? (
                  <>
                    <td className="px-4 py-2"><input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none" /></td>
                    <td className="px-3 py-2"><input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none" /></td>
                    <td className="px-3 py-2">
                      <select value={editRole} onChange={(e) => setEditRole(e.target.value)} className="px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-primary-500 outline-none">
                        {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r === "MEMBER" ? "Member" : r === "ASST_CELL_LEADER" ? "Asst. Cell Leader" : "E-Group Leader"}</option>)}
                      </select>
                    </td>
                    <td></td><td></td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex gap-1 justify-center">
                        <button onClick={saveEdit} className="px-3 py-1 text-xs bg-primary-700 text-white rounded hover:bg-primary-800 transition">Save</button>
                        <button onClick={cancelEdit} className="px-3 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition">Cancel</button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-gray-800">{m.name}</td>
                    <td className="px-3 py-3 text-gray-600">{m.phone || "—"}</td>
                    <td className="px-3 py-3"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">{m.role === "MEMBER" ? "Member" : m.role === "ASST_CELL_LEADER" ? "Asst." : "E-Group"}</span></td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-medium ${(m.attendanceRate || 0) >= 70 ? "text-green-600" : (m.attendanceRate || 0) >= 40 ? "text-yellow-600" : "text-red-500"}`}>{m.attendanceRate || 0}%</span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-medium ${(m.consecutiveAbsences || 0) >= 3 ? "text-red-500" : "text-gray-600"}`}>{m.consecutiveAbsences || 0}</span>
                    </td>
                    {(canEdit || canDelete) && (
                      <td className="px-3 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {canEdit && <button onClick={() => startEdit(m)} className="px-2.5 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition">Edit</button>}
                          {canDelete && <button onClick={() => handleDelete(m.id)} disabled={deleting === m.id} className="px-2.5 py-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 transition">{deleting === m.id ? "..." : "Delete"}</button>}
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>
            ))}
            {paginated.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-400">No members found.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-gray-100">
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      </div>
    </div>
  );
}
